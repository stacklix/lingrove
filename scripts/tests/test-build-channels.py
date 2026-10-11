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
    for name in ['build-channels.mjs', 'build-modules.mjs', 'package-modules.mjs', 'stored-zip.py', 'sync-localizations.mjs', 'verify-release.py']:
        shutil.copy(repository / 'scripts' / name, root / 'scripts' / name)
    (root / 'app/sentra').mkdir(parents=True)
    (root / 'app/sentra/manifest.json').write_text((repository / 'app/sentra/manifest.json').read_text())
    (root / 'packages/host-sdk/src/locales').mkdir(parents=True)
    (root / 'packages/host-sdk/src/locales/messages.json').write_text('{}')
    (root / 'ios/Lingrove/Resources').mkdir(parents=True)
    (root / 'ios/Lingrove/Resources/.gitkeep').touch()
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
output = Path('dist/sentra')
output.mkdir(parents=True)
(output/'index.html').write_text(Path('source.txt').read_text())
''')
    npm.chmod(0o755)
    env = {**os.environ, 'PATH': str(root / 'bin') + os.pathsep + os.environ['PATH']}
    def run(*args):
        subprocess.run(args, cwd=root, env=env, check=True, stdout=subprocess.DEVNULL)
    run('git', 'init', '-b', 'master')
    run('git', 'config', 'user.email', 'test@example.com')
    run('git', 'config', 'user.name', 'Test')
    run('git', 'add', '.')
    run('git', '-c', 'commit.gpgsign=false', 'commit', '-m', 'release source')
    run('node', 'scripts/build-channels.mjs')
    assert (root / 'dist/catalog.snapshot.json').is_file()
    assert not (root / 'dist/catalog.json').exists()
    assert not (root / 'dist/release').exists()
    print('PASS no tags publishes Snapshot only')
    run('git', '-c', 'tag.gpgsign=false', 'tag', 'v1.0.0')
    (root / 'source.txt').write_text('master source')
    run('node', 'scripts/build-channels.mjs')
    snapshot = json.loads((root / 'dist/catalog.snapshot.json').read_text())['modules'][0]
    release = json.loads((root / 'dist/catalog.json').read_text())['modules'][0]
    assert snapshot['downloadUrl'].endswith('-snapshot.zip')
    assert not release['downloadUrl'].endswith('-snapshot.zip')
    assert '/release/packages/' in release['downloadUrl']
    with zipfile.ZipFile(root / 'dist/packages' / snapshot['downloadUrl'].split('/')[-1]) as archive:
        assert archive.read('index.html') == b'master source'
    with zipfile.ZipFile(root / 'dist/release/packages' / release['downloadUrl'].split('/')[-1]) as archive:
        assert archive.read('index.html') == b'tag source'
    print('PASS tagged release uses tag source; Snapshot uses master source; both catalogs and ZIPs verified')
