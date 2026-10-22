import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const json = async (file) => JSON.parse(await readFile(new URL(file, root), 'utf8'));

test('child UI translations live in child packages, outside native and SDK catalogs', async () => {
  const native = (await json('ios/Lingrove/Resources/Localizable.xcstrings')).strings;
  const sdk = await json('packages/host-sdk/src/locales/messages.json');
  const keyboard = await json('app/polykeys/src/locales/messages.json');
  assert.equal(keyboard['键盘语言'].en, 'Keyboard language');
  assert.equal(native['键盘语言'], undefined);
  assert.equal(sdk['键盘语言'], undefined);
  assert.ok(native['应用设置']);
  for (const id of await json('modules.json')) {
    const catalog = await json(`app/${id}/src/locales/messages.json`);
    assert.ok(Object.keys(catalog).length > 0, id);
    for (const [key, value] of Object.entries(catalog)) {
      assert.ok(value.en && value.ja, `${id}: ${key}`);
    }
  }
});

test('native workflows ignore child code, child translations, metadata and generated bundles', async () => {
  for (const file of ['ios.yml', 'ios-adhoc.yml']) {
    const source = await readFile(new URL(`.github/workflows/${file}`, root), 'utf8');
    const groups = [...source.matchAll(/^    paths:\r?\n((?:      - '[^']+'\r?\n)+)/gm)];
    assert.ok(groups.length > 0, file);
    for (const [, block] of groups) {
      const filters = [...block.matchAll(/'([^']+)'/g)].map((match) => match[1]);
      const triggers = (name) =>
        filters.reduce(
          (selected, pattern) =>
            path.matchesGlob(name, pattern.replace(/^!/, '')) ? !pattern.startsWith('!') : selected,
          false,
        );
      for (const child of [
        'app/polykeys/src/App.vue',
        'app/polykeys/src/locales/messages.json',
        'app/polykeys/manifest.json',
        'modules.json',
        'packages/host-sdk/src/locales/messages.json',
        'ios/Lingrove/Resources/BuiltinModules/polykeys/index.html',
      ]) {
        assert.equal(triggers(child), false, `${file}: ${child}`);
      }
      assert.equal(triggers('ios/Lingrove/LingroveApp.swift'), true, file);
      assert.equal(triggers('ios/Lingrove/Resources/Localizable.xcstrings'), true, file);
    }
  }
});

test('child build requires no native translations and leaves existing native resources intact', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lingrove-isolation-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'scripts'));
  await cp(
    new URL('scripts/build-modules.mjs', root),
    path.join(directory, 'scripts/build-modules.mjs'),
  );
  await cp(
    new URL('scripts/build-version.mjs', root),
    path.join(directory, 'scripts/build-version.mjs'),
  );
  await writeFile(path.join(directory, 'modules.json'), '["independent"]');
  await writeFile(path.join(directory, 'scripts/package-modules.mjs'), 'export {};');
  // Stand in for the workspace compiler. No SDK, native source, or native catalog is present.
  const compiler = path.join(directory, 'compile.cjs');
  await writeFile(compiler, `require('node:fs').writeFileSync('child-built', 'ok');`);
  const build = () =>
    spawnSync(process.execPath, ['scripts/build-modules.mjs'], {
      cwd: directory,
      env: { ...process.env, npm_execpath: compiler },
      encoding: 'utf8',
    });
  let result = build();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(directory, 'child-built'), 'utf8'), 'ok');
  await mkdir(path.join(directory, 'ios/Lingrove/Resources'), { recursive: true });
  const native = path.join(directory, 'ios/Lingrove/Resources/Localizable.xcstrings');
  await writeFile(native, 'independently maintained native translations');
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(native, 'utf8'), 'independently maintained native translations');
});
