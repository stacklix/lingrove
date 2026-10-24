import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const result = spawnSync(
  process.env.PYTHON || 'python3',
  [
    path.join(root, 'scripts/build-lock.py'),
    path.join(root, 'node_modules/.cache/lingrove/build.lock'),
    process.execPath,
    path.join(root, 'scripts/build-modules-worker.mjs'),
    ...process.argv.slice(2),
  ],
  { cwd: root, stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
