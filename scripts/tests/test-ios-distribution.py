"""Offline distribution tests: synthetic CMS profile/IPA and an isolated Git remote."""
import copy
import datetime
import importlib.util
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import tempfile
import unittest
from urllib.parse import parse_qs, urlsplit
import html
import re
import zipfile

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('ota', ROOT / 'scripts/package-ios-ota.py')
ota = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ota)


def run(*args, cwd=None, env=None):
    return subprocess.run(args, cwd=cwd, env=env, check=True, capture_output=True, text=True).stdout.strip()


def profile():
    return {
        'Name': 'Lingrove Ad Hoc', 'UUID': 'FAKE-TEST-UUID',
        'TeamIdentifier': ['TEAM123'], 'ApplicationIdentifierPrefix': ['PREFIX123'],
        'ExpirationDate': datetime.datetime.now() + datetime.timedelta(days=30),
        'ProvisionedDevices': ['TEST-DEVICE-PRIVATE'],
        'Entitlements': {'application-identifier': 'PREFIX123.me.stackli.lingrove', 'get-task-allow': False},
    }


class DistributionTests(unittest.TestCase):
    def test_reject_invalid_profiles(self):
        self.assertEqual(ota.validate_profile(profile()), 'TEAM123')
        for kind in ['development', 'app-store', 'enterprise', 'wildcard', 'expired']:
            value = copy.deepcopy(profile())
            if kind == 'development': value['Entitlements']['get-task-allow'] = True
            if kind == 'app-store': del value['ProvisionedDevices']
            if kind == 'enterprise': value['ProvisionsAllDevices'] = True
            if kind == 'wildcard': value['Entitlements']['application-identifier'] = 'PREFIX123.*'
            if kind == 'expired': value['ExpirationDate'] = datetime.datetime(2000, 1, 1)
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                ota.validate_profile(value)

    def test_ota_uses_exported_ipa_metadata(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            (folder / 'profile.plist').write_bytes(plistlib.dumps(profile()))
            run('openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-subj', '/CN=Test Only',
                '-keyout', str(folder / 'key.pem'), '-out', str(folder / 'cert.pem'), '-days', '1')
            run('openssl', 'smime', '-sign', '-binary', '-nodetach', '-in', str(folder / 'profile.plist'),
                '-signer', str(folder / 'cert.pem'), '-inkey', str(folder / 'key.pem'), '-outform', 'DER',
                '-out', str(folder / 'embedded.mobileprovision'))
            ipa = folder / 'test.ipa'
            with zipfile.ZipFile(ipa, 'w') as archive:
                archive.writestr('Payload/Lingrove.app/Info.plist', plistlib.dumps({
                    'CFBundleIdentifier': 'me.stackli.lingrove', 'CFBundleVersion': '42.2',
                    'CFBundleShortVersionString': '1.3.0',
                }))
                archive.write(folder / 'embedded.mobileprovision', 'Payload/Lingrove.app/embedded.mobileprovision')
            site = folder / 'site'
            ota.package(ipa, site, 'https://example.com/project/ios', 'Debug')
            manifest_path = next(site.glob('manifest-*.plist'))
            manifest = plistlib.loads(manifest_path.read_bytes())['items'][0]
            self.assertEqual(manifest['metadata']['bundle-version'], '42.2')
            self.assertEqual(manifest['metadata']['bundle-identifier'], 'me.stackli.lingrove')
            for asset in manifest['assets']:
                self.assertTrue(asset['url'].startswith('https://example.com/project/ios/'))
                self.assertTrue((site / asset['url'].split('/')[-1]).is_file())
            page = (site / 'index.html').read_text()
            latest = json.loads((site / 'latest.json').read_text(encoding='utf-8'))
            self.assertEqual(latest['version'], '1.3.0')
            self.assertEqual(latest['build'], '42.2')
            self.assertEqual(latest['configuration'], 'Debug')
            self.assertEqual(latest['manifestURL'], f'https://example.com/project/ios/{manifest_path.name}')
            self.assertEqual(datetime.datetime.fromisoformat(latest['builtAt']).utcoffset(), datetime.timedelta(0))
            link = html.unescape(re.search(r'href="(itms-services:[^"]+)"', page).group(1))
            self.assertEqual(parse_qs(urlsplit(link).query)['url'], [f'https://example.com/project/ios/{manifest_path.name}'])
            self.assertNotIn('TEST-DEVICE-PRIVATE', page)
            self.assertNotIn('{{', page)
            with self.assertRaises(ValueError):
                ota.package(ipa, folder / 'insecure', 'http://example.com/ios', 'Debug')
            # Optional local preview, explicitly labelled synthetic in the test log.
            if os.environ.get('IOS_OTA_TEST_PREVIEW'):
                shutil.copytree(site, os.environ['IOS_OTA_TEST_PREVIEW'], dirs_exist_ok=True)
                print('Saved synthetic fixture preview (not an installable Apple-signed IPA).')

    def test_publishers_preserve_each_others_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            remote, source = folder / 'remote.git', folder / 'source'
            run('git', 'init', '--bare', str(remote))
            run('git', 'init', '-b', 'master', str(source))
            run('git', 'remote', 'add', 'origin', str(remote), cwd=source)
            run('git', 'config', 'user.name', 'Test', cwd=source)
            run('git', 'config', 'user.email', 'test@example.com', cwd=source)
            (source / 'web').mkdir()
            shutil.copy(ROOT / 'web/ios-pending.html', source / 'web/ios-pending.html')
            history = source / 'source.txt'
            def advance(value):
                history.write_text(value)
                run('git', 'add', 'source.txt', cwd=source)
                run('git', '-c', 'commit.gpgsign=false', 'commit', '-m', value, cwd=source)
                return run('git', 'rev-parse', 'HEAD', cwd=source)
            first = advance('first source')
            web, ios = source / 'dist', source / 'ios-output'
            (web / 'snapshot/app/sentra').mkdir(parents=True)
            (web / 'app/sentra').mkdir(parents=True)
            (web / 'packages').mkdir()
            ios.mkdir()
            (web / 'CNAME').write_text('lingrove.stackli.me')
            (ios / 'index.html').write_text('installer v1')
            (ios / 'app.ipa').write_bytes(b'test IPA')
            env = {**os.environ, 'SOURCE_SHA': first, 'GITHUB_OUTPUT': str(folder / 'outputs')}
            publication_count = 0
            def prepare(channel, commit, version):
                directory = web / 'snapshot' if channel == 'snapshot' else web
                catalog = 'catalog.snapshot.json' if channel == 'snapshot' else 'catalog.json'
                (directory / catalog).write_text(version)
                (directory / 'index.html').write_text(channel + ' home ' + version)
                (directory / 'app/sentra/index.html').write_text(channel + ' HTML ' + version)
                (directory / 'publication.json').write_text(json.dumps({
                    'channel': channel, 'commit': commit,
                    'ref': 'refs/heads/master' if channel == 'snapshot' else 'refs/tags/v1.0.0',
                }))
                if channel == 'release': (directory / 'packages/app.zip').write_bytes(b'release ZIP')
            def publish(mode, directory):
                nonlocal publication_count
                publication_count += 1
                artifact = folder / f'pages-artifact-{publication_count}'
                try:
                    run('node', str(ROOT / 'scripts/publish-pages-tree.mjs'), mode, str(directory),
                        cwd=source, env={**env, 'PAGES_ARTIFACT_DIR': str(artifact)})
                except subprocess.CalledProcessError as error:
                    error.add_note(error.stderr or '')
                    raise
                # The deployment artifact must be byte-for-byte identical to the
                # entire published tree, including untouched channels and hidden files.
                files = run('git', '--git-dir', str(remote), 'ls-tree', '-r', '--name-only', 'gh-pages').splitlines()
                self.assertEqual(sorted(files), sorted(
                    item.relative_to(artifact).as_posix() for item in artifact.rglob('*') if item.is_file()))
                for name in files:
                    expected = subprocess.run(
                        ['git', '--git-dir', str(remote), 'show', f'gh-pages:{name}'],
                        check=True, capture_output=True).stdout
                    self.assertEqual((artifact / name).read_bytes(), expected, name)
            def read(name):
                return run('git', '--git-dir', str(remote), 'show', f'gh-pages:{name}')
            prepare('snapshot', first, 'debug v1')
            publish('snapshot', web)
            self.assertIn('安装包尚未发布', read('ios/index.html'))
            publish('ios', ios)
            self.assertEqual(read('snapshot/catalog.snapshot.json'), 'debug v1')
            self.assertEqual(read('CNAME'), 'lingrove.stackli.me')
            self.assertEqual(read('ios/app.ipa'), 'test IPA')
            second = advance('second source')
            prepare('release', second, 'release v1')
            publish('release', web)
            self.assertEqual(read('snapshot/app/sentra/index.html'), 'snapshot HTML debug v1')
            self.assertEqual(read('app/sentra/index.html'), 'release HTML release v1')
            self.assertEqual(read('packages/app.zip'), 'release ZIP')
            self.assertEqual(read('ios/app.ipa'), 'test IPA')
            third = advance('third source')
            prepare('snapshot', third, 'debug v2')
            publish('snapshot', web)
            self.assertEqual(read('snapshot/catalog.snapshot.json'), 'debug v2')
            self.assertEqual(read('catalog.json'), 'release v1')
            self.assertEqual(read('app/sentra/index.html'), 'release HTML release v1')
            self.assertEqual(read('catalog.json'), 'release v1')
            self.assertEqual(read('index.html'), 'release home release v1')
            before = read('publication.json')
            prepare('release', first, 'old release')
            with self.assertRaises(subprocess.CalledProcessError) as rejected: publish('release', web)
            self.assertIn('Refusing older or divergent release source', rejected.exception.stderr)
            self.assertEqual(read('publication.json'), before)
            prepare('snapshot', first, 'old debug')
            with self.assertRaises(subprocess.CalledProcessError) as rejected: publish('snapshot', web)
            self.assertIn('Refusing older or divergent snapshot source', rejected.exception.stderr)
            self.assertEqual(read('snapshot/catalog.snapshot.json'), 'debug v2')
            (ios / 'app.ipa').unlink()
            (ios / 'new.ipa').write_bytes(b'new IPA')
            publish('ios', ios)
            self.assertEqual(read('snapshot/catalog.snapshot.json'), 'debug v2')
            self.assertEqual(read('catalog.json'), 'release v1')
            self.assertEqual(read('ios/new.ipa'), 'new IPA')
            files = run('git', '--git-dir', str(remote), 'ls-tree', '-r', '--name-only', 'gh-pages')
            self.assertNotIn('ios/app.ipa', files)
            self.assertNotIn('\nrelease/', '\n' + files)
            self.assertNotIn('\ncatalog.snapshot.json', '\n' + files)
            self.assertEqual(run('git', '--git-dir', str(remote), 'rev-list', '--count', 'gh-pages'), '1')
            previous = run('git', '--git-dir', str(remote), 'rev-parse', 'gh-pages')
            stale_artifact = folder / 'stale-artifact'
            stale_artifact.mkdir()
            (stale_artifact / 'stale.txt').write_text('must not be deployed')
            (ios / 'index.html').write_text('installer v2')
            with self.assertRaises(subprocess.CalledProcessError):
                run('node', str(ROOT / 'scripts/publish-pages-tree.mjs'), 'ios', str(ios),
                    cwd=source, env={**env, 'PAGES_ARTIFACT_DIR': str(stale_artifact)})
            self.assertEqual(run('git', '--git-dir', str(remote), 'rev-parse', 'gh-pages'), previous)
            self.assertEqual((stale_artifact / 'stale.txt').read_text(), 'must not be deployed')

if __name__ == '__main__':
    unittest.main()
