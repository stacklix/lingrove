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
            (source / 'web').mkdir()
            shutil.copy(ROOT / 'web/ios-pending.html', source / 'web/ios-pending.html')
            web, ios = source / 'dist', source / 'ios-output'
            web.mkdir(); ios.mkdir()
            (web / 'index.html').write_text('home')
            (web / 'catalog.snapshot.json').write_text('catalog v1')
            (web / 'CNAME').write_text('lingrove.stackli.me')
            (ios / 'index.html').write_text('installer v1')
            (ios / 'app.ipa').write_bytes(b'test IPA')
            env = {**os.environ, 'SOURCE_SHA': 'test', 'GITHUB_OUTPUT': str(folder / 'outputs'),
                   'GIT_CONFIG_COUNT': '1', 'GIT_CONFIG_KEY_0': 'commit.gpgsign', 'GIT_CONFIG_VALUE_0': 'false'}

            def publish(mode, directory):
                run('bash', str(ROOT / 'scripts/publish-pages-tree.sh'), mode, str(directory), cwd=source, env=env)

            def read(path):
                return run('git', '--git-dir', str(remote), 'show', f'gh-pages:{path}')

            publish('web', web)
            self.assertIn('安装包尚未发布', read('ios/index.html'))
            publish('ios', ios)
            self.assertEqual(read('catalog.snapshot.json'), 'catalog v1')
            self.assertEqual(read('CNAME'), 'lingrove.stackli.me')
            self.assertEqual(read('ios/app.ipa'), 'test IPA')
            (web / 'catalog.snapshot.json').write_text('catalog v2')
            publish('web', web)
            self.assertEqual(read('ios/index.html'), 'installer v1')
            (ios / 'app.ipa').unlink()
            (ios / 'new.ipa').write_bytes(b'new IPA')
            publish('ios', ios)
            self.assertEqual(read('catalog.snapshot.json'), 'catalog v2')
            self.assertEqual(read('ios/new.ipa'), 'new IPA')
            files = run('git', '--git-dir', str(remote), 'ls-tree', '-r', '--name-only', 'gh-pages')
            self.assertNotIn('ios/app.ipa', files)
            self.assertEqual(run('git', '--git-dir', str(remote), 'rev-list', '--count', 'gh-pages'), '1')


if __name__ == '__main__':
    unittest.main()
