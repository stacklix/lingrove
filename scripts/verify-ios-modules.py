"""Check the actual iOS product contains exactly the current built modules."""
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent
bundle = Path(sys.argv[1]) / 'BuiltinModules'
names = json.loads((root / 'modules.json').read_text())
catalog_path = root / 'dist/catalog.json'
if not catalog_path.is_file():
    catalog_path = root / 'dist/snapshot/catalog.snapshot.json'
assert catalog_path.is_file(), 'Missing built catalog; run the child-app build first'
source_root = catalog_path.parent / 'app'
expected_hashes = {module['id']: module['sha256'] for module in json.loads(catalog_path.read_text())['modules'] if 'sha256' in module}
assert json.loads((Path(sys.argv[1]) / 'BuiltinModuleHashes.json').read_text()) == expected_hashes, 'Bundled package hashes differ from catalog'
assert source_root.is_dir(), f'Missing built application directory: {source_root}'
assert {p.name for p in source_root.iterdir()} == set(names), 'Built modules differ from modules.json'
assert bundle.is_dir(), 'Missing BuiltinModules in iOS product'
assert {p.name for p in bundle.iterdir()} == set(names), 'Bundled modules differ from modules.json'
for name in names:
    source = source_root / name
    embedded = bundle / name
    def files(directory):
        return {p.relative_to(directory): p.read_bytes() for p in directory.rglob('*') if p.is_file()}
    assert files(embedded) == files(source), f'{name}: stale or missing bundled files'
    manifest = json.loads((embedded / 'manifest.json').read_text())
    assert (embedded / manifest['entry']).is_file(), f'{name}: missing entry'
    print(f'PASS embedded {name} {manifest["version"]}')
