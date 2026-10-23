import { readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { moduleBuildVersion } from './build-version.mjs';
process.env.MODULE_BUILD_VERSION = moduleBuildVersion();
const mode = process.argv.includes('--release') ? 'production' : 'debug';
process.env.MODULE_CHANNEL ||= mode === 'production' ? 'release' : 'snapshot';
if (process.argv.includes('--no-zip') && process.env.MODULE_CHANNEL === 'release')
  throw new Error('--no-zip is only supported for local snapshot builds');
const root = path.resolve(import.meta.dirname, '..');
const npm = process.env.npm_execpath ? [process.execPath, process.env.npm_execpath] : ['npm'];
const modules = JSON.parse(await readFile(path.join(root, 'modules.json'), 'utf8'));
if (
  !Array.isArray(modules) ||
  !modules.length ||
  new Set(modules).size !== modules.length ||
  modules.some((name) => typeof name !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(name))
) {
  throw new Error('modules.json must contain unique module directory names');
}
// Build from a clean directory so retired modules/assets cannot leak into a release.
await rm(path.join(root, 'dist'), { recursive: true, force: true });
for (const module of modules) {
  const result = spawnSync(
    npm[0],
    [...npm.slice(1), 'run', 'build', '--workspace', `app/${module}`, '--', '--mode', mode],
    {
      cwd: root,
      stdio: 'inherit',
    },
  );
  if (result.status !== 0) throw new Error(`Build failed: ${module}`);
}
await import('./package-modules.mjs');
