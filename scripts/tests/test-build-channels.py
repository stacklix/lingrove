"""Exercise channel orchestration in an isolated repo with a tiny build fixture."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

repository = Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='lingrove-channels-') as temporary:
    root = Path(temporary)
    (root / 'scripts').mkdir()
    for name in ['build-version.mjs', 'build-channels.mjs', 'build-modules.mjs', 'package-modules.mjs', 'stored-zip.py', 'verify-release.py']:
        shutil.copy(repository / 'scripts' / name, root / 'scripts' / name)
    (root / 'app/sentra').mkdir(parents=True)
    (root / 'app/sentra/manifest.json').write_text((repository / 'app/sentra/manifest.json').read_text())
    (root / 'app/sentra/package.json').write_text('{"name":"@lingrove/sentra"}')
    (root / 'app/sentra/index.html').write_text('<title>Sentra</title>')
    (root / 'ios/Lingrove/Resources').mkdir(parents=True)
    host_catalog = root / 'ios/Lingrove/Resources/Localizable.xcstrings'
    host_catalog.write_text('host-only-catalog')
    (root / 'modules.json').write_text('["sentra"]')
    (root / 'index.html').write_text('home')
    (root / 'source.txt').write_text('tag source')
    (root / '.gitignore').write_text('dist/\nios/Lingrove/Resources/BuiltinModules/\nios/Lingrove/Resources/BuiltinModuleHashes.json\n')
    npm = root / 'compiler.cjs'
    npm.write_text('''const fs = require('node:fs');
if (process.argv[2] === 'ci') process.exit(0);
if (process.argv[2] !== 'run' || process.argv[3] !== 'build') throw Error('Unexpected npm command');
fs.mkdirSync('dist/app/sentra', {recursive: true});
fs.writeFileSync('dist/app/sentra/index.html', fs.readFileSync('source.txt'));
''')
    env = {**os.environ, 'MODULE_BUILD_VERSION': '20261020', 'npm_execpath': str(npm), 'GITHUB_REF_TYPE': 'branch', 'GITHUB_REF': 'refs/heads/master'}
    def run(*args, extra_env=None):
        subprocess.run(args, cwd=root, env={**env, **(extra_env or {})}, check=True, stdout=subprocess.DEVNULL)
    run('git', 'init', '-b', 'master')
    run('git', 'config', 'user.email', 'test@example.com')
    run('git', 'config', 'user.name', 'Test')
    run('git', 'add', '.')
    run('git', '-c', 'commit.gpgsign=false', 'commit', '-m', 'release source')
    run('node', 'scripts/build-channels.mjs')
    assert host_catalog.read_text() == 'host-only-catalog', 'Child build must not read or rewrite the host catalog'
    assert (root / 'dist/snapshot/catalog.snapshot.json').is_file()
    assert not (root / 'dist/catalog.snapshot.json').exists()
    assert not (root / 'dist/catalog.json').exists()
    assert not (root / 'dist/release').exists()
    assert list((root / 'dist/snapshot/packages').glob('*.zip'))
    print('PASS master publishes catalog, ZIP and HTML under snapshot/')
    run('git', '-c', 'tag.gpgsign=false', 'tag', 'v1.0.0')
    (root / 'source.txt').write_text('master source')
    manifest_path = root / 'app/sentra/manifest.json'
    tag_manifest = json.loads(manifest_path.read_text())
    master_manifest = {**tag_manifest, 'localizedDescriptions': {**tag_manifest['localizedDescriptions'], 'en': 'Updated introduction on master.'}}
    manifest_path.write_text(json.dumps(master_manifest))
    run('git', 'add', '.')
    run('git', '-c', 'commit.gpgsign=false', 'commit', '-m', 'new master source')
    run('node', 'scripts/build-channels.mjs')
    snapshot = json.loads((root / 'dist/snapshot/catalog.snapshot.json').read_text())['modules'][0]
    assert all(key in snapshot for key in ['downloadUrl', 'size', 'sha256'])
    assert snapshot['webUrl'].endswith('/snapshot/app/sentra/index.html')
    assert snapshot['localizedDescriptions'] == master_manifest['localizedDescriptions']
    assert (root / 'dist/snapshot/app/sentra/index.html').read_bytes() == b'master source'
    assert not (root / 'dist/release').exists(), 'master must not rebuild tags'
    assert not (root / 'dist/catalog.json').exists()
    run('git', 'checkout', '--detach', 'v1.0.0')
    run('node', 'scripts/build-channels.mjs', extra_env={'GITHUB_REF_TYPE': 'tag', 'GITHUB_REF': 'refs/tags/v1.0.0'})
    release = json.loads((root / 'dist/catalog.json').read_text())['modules'][0]
    assert release['downloadUrl'].endswith('/packages/sentra-20261020.zip')
    assert release['webUrl'].endswith('/app/sentra/index.html')
    assert release['localizedDescriptions'] == tag_manifest['localizedDescriptions']
    assert (root / 'dist/app/sentra/index.html').read_bytes() == b'tag source'
    assert not (root / 'dist/snapshot').exists(), 'tag must not produce debug outputs'
    assert not (root / 'dist/release').exists(), 'formal outputs belong at root'
    publication = json.loads((root / 'dist/publication.json').read_text())
    assert publication['ref'] == 'refs/tags/v1.0.0'
    with zipfile.ZipFile(root / 'dist/packages' / release['downloadUrl'].split('/')[-1]) as archive:
        assert archive.read('index.html') == b'tag source'
        assert json.loads(archive.read('manifest.json'))['localizedDescriptions'] == tag_manifest['localizedDescriptions']
    print('PASS master never rebuilds tags; tag emits matching HTML, JSON and ZIPs at the site root')
