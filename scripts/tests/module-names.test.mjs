import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);

test('a partial app rename fails before deleting outputs or compiling', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lingrove-names-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'scripts'));
  for (const file of [
    'build-modules.mjs',
    'build-modules-worker.mjs',
    'build-lock.py',
    'build-version.mjs',
  ])
    await cp(new URL(`scripts/${file}`, root), path.join(directory, 'scripts', file));
  await writeFile(path.join(directory, 'scripts/package-modules.mjs'), '');
  await mkdir(path.join(directory, 'app/example'), { recursive: true });
  await writeFile(path.join(directory, 'modules.json'), '["example"]');
  const compiler = path.join(directory, 'compiler.cjs');
  await writeFile(compiler, `require('node:fs').writeFileSync('compiled', 'yes');`);
  const build = () =>
    spawnSync(process.execPath, ['scripts/build-modules.mjs'], {
      cwd: directory,
      env: { ...process.env, npm_execpath: compiler },
      encoding: 'utf8',
    });
  const manifest = { id: 'example', name: 'Example', entry: 'index.html' };
  const pkg = { name: '@lingrove/example' };
  const html = '<title>Example · Practice</title>';
  const save = async (module = manifest, workspace = pkg, entry = html) => {
    await writeFile(path.join(directory, 'app/example/manifest.json'), JSON.stringify(module));
    await writeFile(path.join(directory, 'app/example/package.json'), JSON.stringify(workspace));
    await writeFile(path.join(directory, 'app/example/index.html'), entry);
  };
  await save();
  const valid = build();
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(await readFile(path.join(directory, 'compiled'), 'utf8'), 'yes');
  await rm(path.join(directory, 'compiled'));
  await mkdir(path.join(directory, 'dist'));
  await writeFile(path.join(directory, 'dist/previous'), 'keep until validation passes');
  for (const [module, workspace, entry, message] of [
    [{ ...manifest, name: 'Renamed' }, pkg, html, /display name, module ID/],
    [{ ...manifest, id: 'renamed' }, pkg, html, /display name, module ID/],
    [manifest, { name: '@lingrove/renamed' }, html, /npm package name/],
    [manifest, pkg, '<title>Renamed · Practice</title>', /page title/],
  ]) {
    await save(module, workspace, entry);
    const invalid = build();
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, message);
    assert.equal(
      await readFile(path.join(directory, 'dist/previous'), 'utf8'),
      'keep until validation passes',
    );
    await assert.rejects(readFile(path.join(directory, 'compiled')), { code: 'ENOENT' });
  }
});

test('all app entry points and browser storage use their current module identity', async () => {
  const ids = JSON.parse(await readFile(new URL('modules.json', root), 'utf8'));
  const home = await readFile(new URL('index.html', root), 'utf8');
  for (const id of ids) {
    const app = new URL(`app/${id}/`, root);
    const { name } = JSON.parse(await readFile(new URL('manifest.json', app), 'utf8'));
    assert.ok(home.includes(`<h3>${name}</h3>`), `${id}: homepage display name`);
    for (const card of home.matchAll(/<a\b[^>]*href="\.\/app\/([^/]+)\/"[^>]*>([\s\S]*?)<\/a>/g)) {
      if (card[2].includes(`<h3>${name}</h3>`)) assert.equal(card[1], id);
    }
    const sources = await readdir(new URL('src/', app), { recursive: true });
    for (const file of sources.filter((file) => /\.(ts|vue)$/.test(file))) {
      const source = await readFile(new URL(`src/${file.replaceAll('\\', '/')}`, app), 'utf8');
      for (const [, storageID] of source.matchAll(/\bmoduleStorage\(['"]([^'"]+)['"]\)/g))
        assert.equal(storageID, id, `${id}/${file}: storage namespace`);
    }
  }
});
