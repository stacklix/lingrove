"""Check the actual iOS product contains exactly the current built modules."""
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent
bundle = Path(sys.argv[1]) / 'BuiltinModules'
names = json.loads((root / 'modules.json').read_text())
assert bundle.is_dir(), 'Missing BuiltinModules in iOS product'
assert {p.name for p in bundle.iterdir()} == set(names), 'Bundled modules differ from modules.json'
for name in names:
    source = root / 'dist' / name
    embedded = bundle / name
    def files(directory):
        return {p.relative_to(directory): p.read_bytes() for p in directory.rglob('*') if p.is_file()}
    assert files(embedded) == files(source), f'{name}: stale or missing bundled files'
    manifest = json.loads((embedded / 'manifest.json').read_text())
    assert (embedded / manifest['entry']).is_file(), f'{name}: missing entry'
    print(f'PASS embedded {name} {manifest["version"]}')
