// Publish the checked-out source as Snapshot and the triggering tag as Release.
// Branch builds continue publishing the most recently created tag as Release.
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { moduleBuildVersion } from './build-version.mjs';
process.env.MODULE_BUILD_VERSION = moduleBuildVersion();
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const base = (process.env.MODULE_BASE_URL || 'https://lingrove.stackli.me').replace(/\/$/, '');
function run(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
const tags = spawnSync('git', ['for-each-ref', '--sort=-creatordate', '--format=%(refname)', 'refs/tags'], { cwd: root, encoding: 'utf8' });
if (tags.status !== 0) throw new Error('Cannot list release tags');
const tag = process.env.GITHUB_REF_TYPE === 'tag'
  ? process.env.GITHUB_REF
  : tags.stdout.trim().split('\n').filter(Boolean)[0];
run('node', ['scripts/build-modules.mjs'], root, { ...process.env, MODULE_CHANNEL: 'snapshot', MODULE_BASE_URL: base });
run('python3', ['scripts/verify-release.py', '--snapshot']);
if (tag) {
  const temporary = await mkdtemp(path.join(tmpdir(), 'lingrove-release-'));
  try {
    const source = path.join(temporary, 'source');
    await mkdir(source);
    const archive = path.join(temporary, 'source.tar');
    run('git', ['archive', '--format=tar', '-o', archive, tag]);
    run('tar', ['-xf', archive, '-C', source]);
    // Use the current packaging contract with the exact tagged application sources.
    for (const script of ['build-version.mjs', 'build-modules.mjs', 'package-modules.mjs', 'stored-zip.py', 'sync-localizations.mjs', 'verify-release.py']) {
      await cp(path.join(root, 'scripts', script), path.join(source, 'scripts', script));
    }
    run('npm', ['ci'], source);
    run('node', ['scripts/build-modules.mjs', '--release'], source, {
      ...process.env, MODULE_CHANNEL: 'release', MODULE_BASE_URL: `${base}/release`,
    });
    run('python3', ['scripts/verify-release.py'], source);
    await cp(path.join(source, 'dist'), path.join(root, 'dist/release'), { recursive: true });
    await cp(path.join(source, 'dist/catalog.json'), path.join(root, 'dist/catalog.json'));
    console.log(`Release built from ${tag}; Snapshot built from the checked-out source.`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
} else {
  console.log('No tags: publishing Snapshot only, without a release catalog or packages.');
}
