// Each invocation builds only the triggering channel from its checked-out commit.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const release = process.env.GITHUB_REF_TYPE === 'tag';
const channel = release ? 'release' : 'snapshot';
const ref = process.env.GITHUB_REF || 'refs/heads/master';
if (release && !ref.startsWith('refs/tags/')) throw new Error('Release publication requires a tag');
if (!release && ref !== 'refs/heads/master') throw new Error('Debug publication requires master');
function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      MODULE_CHANNEL: channel,
    },
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
function git(...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Cannot read source commit');
  return result.stdout.trim();
}
const commit = git('rev-parse', 'HEAD');
if (release && git('rev-parse', `${ref}^{commit}`) !== commit)
  throw new Error('Checked-out source must match the triggering tag');
run(process.execPath, ['scripts/build-modules.mjs', ...(release ? ['--release'] : [])]);
run(process.env.PYTHON || 'python3', [
  'scripts/verify-release.py',
  ...(release ? [] : ['--snapshot']),
]);
await writeFile(
  path.join(root, 'dist', ...(release ? [] : ['snapshot']), 'publication.json'),
  JSON.stringify({ channel, ref, commit }, null, 2),
);
console.log(`Built ${channel} from ${ref} (${commit}).`);
