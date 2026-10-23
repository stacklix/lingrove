import { cp, mkdir, mkdtemp, readFile, rm, writeFile, appendFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function inside(parent, name) {
  const target = path.resolve(parent, name);
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error('Unsafe publication path');
  return target;
}
async function exists(file) {
  try {
    await readFile(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
export async function publishPages({
  mode,
  sourceDir,
  repository = process.cwd(),
  env = process.env,
}) {
  if (!['snapshot', 'release', 'ios'].includes(mode))
    throw new Error('Expected snapshot, release or ios');
  repository = path.resolve(repository);
  sourceDir = path.resolve(sourceDir);
  const temporary = await mkdtemp(path.join(tmpdir(), 'lingrove-publish-'));
  const site = inside(temporary, 'site');
  const git = (args, options = {}) =>
    execFileSync('git', args, {
      cwd: repository,
      env,
      maxBuffer: 100 * 1024 * 1024,
      ...options,
    });
  try {
    await mkdir(site);
    const remote = spawnSync('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/gh-pages'], {
      cwd: repository,
      env,
      encoding: 'utf8',
    });
    let previous = '';
    if (remote.status === 0) {
      git(['fetch', '--no-tags', 'origin', '+refs/heads/gh-pages:refs/remotes/origin/gh-pages']);
      previous = git(['rev-parse', 'refs/remotes/origin/gh-pages'], { encoding: 'utf8' }).trim();
      // Export regular files only; never materialize links from a publication tree.
      const entries = git(['ls-tree', '-rz', previous], { encoding: 'utf8' })
        .split('\0')
        .filter(Boolean);
      for (const entry of entries) {
        const [header, name] = entry.split('\t');
        const [permissions, kind, object] = header.split(' ');
        if (!['100644', '100755'].includes(permissions) || kind !== 'blob')
          throw new Error('Unsupported published file type');
        const target = inside(site, name);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, git(['cat-file', 'blob', object]));
      }
    } else if (remote.status !== 2) {
      throw new Error(remote.stderr || 'Cannot read gh-pages');
    }
    if (mode === 'ios') {
      if (!previous) throw new Error('Run the web Pages workflow first.');
      await rm(inside(site, 'ios'), { recursive: true, force: true });
      await cp(sourceDir, inside(site, 'ios'), { recursive: true });
    } else {
      const incoming = mode === 'snapshot' ? inside(sourceDir, 'snapshot') : sourceDir;
      const catalogName = mode === 'snapshot' ? 'catalog.snapshot.json' : 'catalog.json';
      if (
        !(await exists(inside(incoming, catalogName))) ||
        !(await exists(inside(incoming, 'index.html')))
      )
        throw new Error('Missing channel catalog or HTML');
      const publication = JSON.parse(await readFile(inside(incoming, 'publication.json'), 'utf8'));
      if (publication.channel !== mode || !/^[a-f0-9]{40}$/.test(publication.commit))
        throw new Error('Invalid publication identity');
      if (
        (mode === 'release' && !publication.ref?.startsWith('refs/tags/')) ||
        (mode === 'snapshot' && publication.ref !== 'refs/heads/master')
      )
        throw new Error('Invalid publication ref');
      const destination = mode === 'snapshot' ? inside(site, 'snapshot') : site;
      const priorFile = inside(destination, 'publication.json');
      if (await exists(priorFile)) {
        const prior = JSON.parse(await readFile(priorFile, 'utf8'));
        if (prior.commit !== publication.commit) {
          const ancestry = spawnSync(
            'git',
            ['merge-base', '--is-ancestor', prior.commit, publication.commit],
            { cwd: repository, env },
          );
          if (ancestry.status !== 0)
            throw new Error(`Refusing older or divergent ${mode} source: ${publication.ref}`);
        }
      }
      if (mode === 'snapshot') {
        await rm(destination, { recursive: true, force: true });
        await cp(incoming, destination, { recursive: true });
      } else {
        // Formal outputs own these root paths; snapshot/ and ios/ are independent.
        for (const name of ['app', 'packages', 'catalog.json', 'index.html', 'publication.json']) {
          await rm(inside(site, name), { recursive: true, force: true });
          await cp(inside(incoming, name), inside(site, name), { recursive: true });
        }
        await rm(inside(site, 'release'), { recursive: true, force: true });
      }
      await rm(inside(site, 'catalog.snapshot.json'), { force: true });
      if (await exists(inside(sourceDir, 'CNAME')))
        await cp(inside(sourceDir, 'CNAME'), inside(site, 'CNAME'));
      else await rm(inside(site, 'CNAME'), { force: true });
      if (!(await exists(inside(site, 'ios/index.html')))) {
        await mkdir(inside(site, 'ios'), { recursive: true });
        await cp(path.join(repository, 'web/ios-pending.html'), inside(site, 'ios/index.html'));
      }
    }
    if (
      !(await exists(inside(site, 'index.html'))) &&
      (await exists(inside(site, 'snapshot/index.html')))
    )
      await writeFile(
        inside(site, 'index.html'),
        '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./snapshot/"><title>Lingrove</title><a href="./snapshot/">Lingrove</a></html>\n',
      );
    if (!(await exists(inside(site, 'index.html')))) throw new Error('Missing site entry');
    await writeFile(inside(site, '.nojekyll'), '');
    const gitDir = git(['rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim();
    const publicationEnv = {
      ...env,
      GIT_DIR: gitDir,
      GIT_WORK_TREE: site,
      GIT_INDEX_FILE: inside(temporary, 'index'),
    };
    git(['read-tree', '--empty'], { env: publicationEnv });
    git(['add', '--all', '--', '.'], { cwd: site, env: publicationEnv });
    const tree = git(['write-tree'], { env: publicationEnv, encoding: 'utf8' }).trim();
    const commit = git(
      [
        '-c',
        'user.name=github-actions[bot]',
        '-c',
        'user.email=41898282+github-actions[bot]@users.noreply.github.com',
        '-c',
        'commit.gpgsign=false',
        'commit-tree',
        tree,
        '-m',
        `Publish ${mode} (${env.SOURCE_SHA || 'local'})`,
      ],
      { env: publicationEnv, encoding: 'utf8' },
    ).trim();
    git([
      'push',
      `--force-with-lease=refs/heads/gh-pages:${previous}`,
      'origin',
      `${commit}:refs/heads/gh-pages`,
    ]);
    if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `commit=${commit}\n`);
    return commit;
  } finally {
    if (
      path.dirname(temporary) !== path.resolve(tmpdir()) ||
      !path.basename(temporary).startsWith('lingrove-publish-')
    )
      throw new Error('Unsafe cleanup path');
    await rm(temporary, { recursive: true, force: true });
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await publishPages({ mode: process.argv[2], sourceDir: process.argv[3] });
}
