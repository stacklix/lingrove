from pathlib import Path
import json,sys,zipfile
root=Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True)
base=json.loads(Path('app/sentra/manifest.json').read_text())
# Keep upgrade scenarios independent of the shipping module version.
base['version']='20260101'
localized_update={**base,'version':'20260102','localizedDescriptions':{**base['localizedDescriptions'],'en':'Updated description delivered by the child app.'}}
(root/'localized-update.json').write_text(json.dumps(localized_update))
with zipfile.ZipFile(root/'localized-update.zip','w',compression=zipfile.ZIP_STORED) as archive:
    archive.writestr('manifest.json',json.dumps(localized_update))
    archive.writestr('index.html','localized update')
for name,version in [('valid','20260102'),('newer','20260103'),('rebuilt','20260102')]:
    with zipfile.ZipFile(root/f'{name}.zip','w',compression=zipfile.ZIP_STORED) as archive:
        archive.writestr('manifest.json',json.dumps({**base,'version':version}))
        archive.writestr('index.html',f'<!doctype html><html><head></head><body>{name}</body></html>')
parallel={**base,'id':'parallel','name':'Parallel'}
parallel_builtin=root/'concurrent'/'builtin'/'parallel';parallel_builtin.mkdir(parents=True,exist_ok=True)
(parallel_builtin/'manifest.json').write_text(json.dumps(parallel))
(parallel_builtin/'index.html').write_text('parallel builtin')
concurrent_sentra=root/'concurrent'/'builtin'/'sentra';concurrent_sentra.mkdir(parents=True,exist_ok=True)
(concurrent_sentra/'manifest.json').write_text(json.dumps(base))
(concurrent_sentra/'index.html').write_text('sentra builtin')
with zipfile.ZipFile(root/'parallel.zip','w',compression=zipfile.ZIP_STORED) as archive:
    archive.writestr('manifest.json',json.dumps({**parallel,'version':'20260102'}))
    archive.writestr('index.html','<!doctype html><html><head></head><body>parallel</body></html>')
for name,entry,compression in [('traversal','../escape',zipfile.ZIP_STORED),('absolute','/escape',zipfile.ZIP_STORED),('compressed','index.html',zipfile.ZIP_DEFLATED)]:
    with zipfile.ZipFile(root/f'{name}.zip','w',compression=compression) as archive:archive.writestr(entry,'bad')
with zipfile.ZipFile(root/'symlink.zip','w') as archive:
    info=zipfile.ZipInfo('link');info.external_attr=0o120777 << 16;archive.writestr(info,'/tmp/escape')
(root/'truncated.zip').write_bytes((root/'valid.zip').read_bytes()[:45])
builtin=root/'builtin'/'sentra';builtin.mkdir(parents=True,exist_ok=True)
(builtin/'manifest.json').write_text(json.dumps(base));(builtin/'index.html').write_text('builtin')
