"""Validate the exact catalog, ZIP packages and browser files before publishing."""
import argparse
import hashlib
from datetime import datetime
import json
from pathlib import Path
import re
from urllib.parse import urlparse
import zipfile

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=root / 'dist')
parser.add_argument('--snapshot', action='store_true')
args = parser.parse_args()
site = args.output
snapshot = args.snapshot or not (site / 'catalog.json').is_file()
output = site / 'snapshot' if snapshot else site
expected = json.loads((root / 'modules.json').read_text())
catalog = json.loads((output / ('catalog.snapshot.json' if snapshot else 'catalog.json')).read_text())
assert set(catalog) == {'modules'}, 'Catalog must be plain JSON with modules'
assert [module['id'] for module in catalog['modules']] == expected, 'Catalog does not match modules.json'
assert (output / 'index.html').is_file() and (site / '.nojekyll').is_file()
for module in catalog['modules']:
    name = module['id']
    assert re.fullmatch(r'[0-9]{8}', module['version']), f'{name}: invalid build-date version'
    assert datetime.strptime(module['version'], '%Y%m%d').strftime('%Y%m%d') == module['version']
    directory = output / 'app' / name
    manifest = json.loads((directory / 'manifest.json').read_text())
    assert all(module[key] == value for key, value in manifest.items()), f'{name}: manifest mismatch'
    web_url = urlparse(module['webUrl'])
    assert web_url.scheme == 'https'
    assert web_url.path.endswith(f'{"/snapshot" if snapshot else ""}/app/{name}/')
    files = {file.relative_to(directory).as_posix(): file.read_bytes() for file in directory.rglob('*') if file.is_file()}
    if name == 'omniglyph':
        assert not any(file.endswith('.wav') for file in files), 'omniglyph: standalone WAV duplicates embedded audio'
        assert 'audio/SOURCES.json' in files and 'audio/README.md' in files, 'omniglyph: missing audio attribution'
    if snapshot:
        assert not any(key in module for key in ('downloadUrl', 'size', 'sha256')), f'{name}: debug catalog must not advertise ZIP packages'
    else:
        zip_url = urlparse(module['downloadUrl'])
        assert zip_url.scheme == 'https' and web_url.netloc == zip_url.netloc
        assert zip_url.path.endswith(f'/packages/{name}-{module["version"]}.zip')
        package = output / 'packages' / f'{name}-{module["version"]}.zip'
        data = package.read_bytes()
        assert len(data) == module['size'], f'{name}: size mismatch'
        assert hashlib.sha256(data).hexdigest() == module['sha256'], f'{name}: hash mismatch'
        with zipfile.ZipFile(package) as archive:
            assert archive.testzip() is None, f'{name}: corrupt ZIP'
            assert len(archive.namelist()) == len(set(archive.namelist()))
            assert set(archive.namelist()) == set(files), f'{name}: ZIP and browser files differ'
            for entry in archive.infolist():
                assert entry.compress_type == zipfile.ZIP_STORED
                assert archive.read(entry.filename) == files[entry.filename]
    html = (directory / module['entry']).read_text()
    for asset in re.findall(r'(?:src|href)="([^"#]+)"', html):
        assert not asset.startswith(('http:', 'https:', '/')), f'{name}: entry asset must be relative: {asset}'
        assert (directory / asset).is_file(), f'{name}: missing entry asset: {asset}'
    print(f'PASS {name}: {"debug catalog and browser assets" if snapshot else "catalog, ZIP integrity, identical browser files and entry assets"}')
if snapshot:
    assert not list(site.rglob('*.zip')), 'Debug builds must not produce ZIP packages'
    assert not (site / 'catalog.snapshot.json').exists(), 'Debug catalog belongs under snapshot/'
else:
    assert not (site / 'release').exists(), 'Release artifacts belong at the site root'
print('Release artifacts verified')
