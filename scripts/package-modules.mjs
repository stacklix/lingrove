import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { moduleBuildVersion } from './build-version.mjs';
const root = path.resolve(import.meta.dirname, '..');
const base = (process.env.MODULE_BASE_URL || 'https://lingrove.stackli.me').replace(/\/$/, '');
if (new URL(base).protocol !== 'https:') throw new Error('MODULE_BASE_URL must use HTTPS');
const names = JSON.parse(await readFile(path.join(root, 'modules.json'), 'utf8'));
const modules = [];
const version = moduleBuildVersion();
const snapshot = process.env.MODULE_CHANNEL === 'snapshot';
await rm(path.join(root, 'ios/Lingrove/Resources/BuiltinModules'), {
  recursive: true,
  force: true,
});
await mkdir(path.join(root, 'dist/packages'), { recursive: true });
for (const name of names) {
  const manifest = JSON.parse(await readFile(path.join(root, 'app', name, 'manifest.json'), 'utf8'));
  manifest.version = version;
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(manifest.id))
    throw new Error('Invalid module identity');
  if (manifest.id !== name) throw new Error('Module ID must match its directory name');
  const output = path.join(root, 'dist', 'app', name);
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const archive = `${manifest.id}-${manifest.version}${snapshot ? '-snapshot' : ''}.zip`;
  const zipPath = path.join(root, 'dist/packages', archive);
  const result = spawnSync(process.env.PYTHON || 'python3', [path.join(root, 'scripts/stored-zip.py'), output, zipPath], {
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error('ZIP packaging failed');
  const data = await readFile(zipPath);
  modules.push({
    ...manifest,
    webUrl: `${base}/app/${name}/`,
    downloadUrl: `${base}/packages/${archive}`,
    size: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  });
  const builtin = path.join(root, 'ios/Lingrove/Resources/BuiltinModules', manifest.id);
  await rm(builtin, { recursive: true, force: true });
  await mkdir(path.dirname(builtin), { recursive: true });
  await cp(output, builtin, { recursive: true });
}
await writeFile(path.join(root, snapshot ? 'dist/catalog.snapshot.json' : 'dist/catalog.json'), JSON.stringify({ modules }, null, 2));
// Remove obsolete generated artifacts from builds using the old catalog format.
await rm(path.join(root, 'dist/public-key.txt'), { force: true });
await rm(path.join(root, 'dist/catalog.preview.json'), { force: true });
await cp(path.join(root, 'index.html'), path.join(root, 'dist/index.html'));
await writeFile(path.join(root, 'dist/.nojekyll'), '');
// GitHub project domains use their default hostname; custom domains need CNAME.
const hostname = new URL(base).hostname;
if (!hostname.endsWith('.github.io'))
  await writeFile(path.join(root, 'dist/CNAME'), hostname + '\n');
console.log(
  `Built ${modules.length} module(s), static catalog, archives and native bundled resources.`,
);
