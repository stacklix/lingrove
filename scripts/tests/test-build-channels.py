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
    (root / 'ios/Lingrove/Resources').mkdir(parents=True)
    host_catalog = root / 'ios/Lingrove/Resources/Localizable.xcstrings'
    host_catalog.write_text('host-only-catalog')
    (root / 'modules.json').write_text('["sentra"]')
    (root / 'index.html').write_text('home')
    (root / 'source.txt').write_text('tag source')
    (root / '.gitignore').write_text('dist/\nbin/\n')
    (root / 'bin').mkdir()
    npm = root / 'bin/npm'
    npm.write_text('''#!/usr/bin/env python3
from pathlib import Path
import sys
if sys.argv[1] == 'ci': sys.exit(0)
assert sys.argv[1:3] == ['run', 'build']
output = Path('dist/app/sentra')
output.mkdir(parents=True)
(output/'index.html').write_text(Path('source.txt').read_text())
''')
    npm.chmod(0o755)
    env = {**os.environ, 'MODULE_BUILD_VERSION': '20261020', 'PATH': str(root / 'bin') + os.pathsep + os.environ['PATH']}
    def run(*args):
        subprocess.run(args, cwd=root, env=env, check=True, stdout=subprocess.DEVNULL)
    run('git', 'init', '-b', 'master')
    run('git', 'config', 'user.email', 'test@example.com')
    run('git', 'config', 'user.name', 'Test')
    run('git', 'add', '.')
    run('git', '-c', 'commit.gpgsign=false', 'commit', '-m', 'release source')
    run('node', 'scripts/build-channels.mjs')
    assert host_catalog.read_text() == 'host-only-catalog', 'Child build must not read or rewrite the host catalog'
    assert (root / 'dist/catalog.snapshot.json').is_file()
    assert not (root / 'dist/catalog.json').exists()
    assert not (root / 'dist/release').exists()
    print('PASS no tags publishes Snapshot only')
    run('git', '-c', 'tag.gpgsign=false', 'tag', 'v1.0.0')
    (root / 'source.txt').write_text('master source')
    manifest_path = root / 'app/sentra/manifest.json'
    tag_manifest = json.loads(manifest_path.read_text())
    master_manifest = json.loads(manifest_path.read_text())
    master_manifest['localizedDescriptions']['en'] = 'Updated introduction on master.'
    manifest_path.write_text(json.dumps(master_manifest))
    run('node', 'scripts/build-channels.mjs')
    snapshot = json.loads((root / 'dist/catalog.snapshot.json').read_text())['modules'][0]
    release = json.loads((root / 'dist/catalog.json').read_text())['modules'][0]
    assert snapshot['version'] == release['version'] == '20261020'
    assert snapshot['downloadUrl'].endswith('-20261020-snapshot.zip')
    assert release['downloadUrl'].endswith('-20261020.zip')
    assert '/release/packages/' in release['downloadUrl']
    assert snapshot['localizedDescriptions'] == master_manifest['localizedDescriptions']
    assert release['localizedDescriptions'] == tag_manifest['localizedDescriptions']
    with zipfile.ZipFile(root / 'dist/packages' / snapshot['downloadUrl'].split('/')[-1]) as archive:
        assert archive.read('index.html') == b'master source'
        assert json.loads(archive.read('manifest.json'))['localizedDescriptions'] == snapshot['localizedDescriptions']
    with zipfile.ZipFile(root / 'dist/release/packages' / release['downloadUrl'].split('/')[-1]) as archive:
        assert archive.read('index.html') == b'tag source'
        assert json.loads(archive.read('manifest.json'))['localizedDescriptions'] == release['localizedDescriptions']
    print('PASS tagged release uses tag source; Snapshot uses master source; both catalogs and ZIPs verified')
    print('PASS translated introductions follow their child-app channel in catalogs and ZIPs')
