import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const json = async (file) => JSON.parse(await readFile(new URL(file, root), 'utf8'));

async function sourceTree(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = await Promise.all(
    entries.map((entry) => {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory() && entry.name !== 'Resources') return sourceTree(file, extension);
      return entry.isFile() && entry.name.endsWith(extension) ? readFile(file, 'utf8') : '';
    }),
  );
  return sources.join('\n');
}

const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function nativeOwns(source, key) {
  const pattern = key
    .split(/(\{\d+\})/)
    .map((part) =>
      /^\{\d+\}$/.test(part)
        ? String.raw`\\\([^\r\n]*?\)`
        : escapePattern(JSON.stringify(part).slice(1, -1)),
    )
    .join('');
  return new RegExp(`"${pattern}"`).test(source);
}

function sdkOwns(source, key) {
  return [
    JSON.stringify(key),
    "'" + key.replaceAll('\\', '\\\\').replaceAll("'", "\\'") + "'",
    '`' + key.replaceAll('\\', '\\\\').replaceAll('`', '\\`') + '`',
  ].some((literal) => source.includes(literal));
}

test('catalog ownership accepts real Swift interpolation but rejects substring-only matches', () => {
  const source = String.raw`Text("应用设置"); Text("语法手册介绍");
    throw ModuleError.invalid("无法保存设置（\(status)）")`;
  assert.equal(nativeOwns(source, '应用设置'), true);
  assert.equal(nativeOwns(source, '无法保存设置（{0}）'), true);
  assert.equal(nativeOwns(source, '语法手册'), false);
  assert.equal(nativeOwns(source, 'OtherApp · 语法手册'), false);
  assert.equal(sdkOwns("translate('已取消')", '已取消'), true);
  assert.equal(sdkOwns("translate('关闭目录')", '目录'), false);
});

test('native and SDK catalogs contain only entries owned by their production source', async () => {
  const native = (await json('ios/Lingrove/Resources/Localizable.xcstrings')).strings;
  const sdk = await json('packages/host-sdk/src/locales/messages.json');
  const nativeSource = await sourceTree(new URL('ios/Lingrove/', root), '.swift');
  const sdkSource = await sourceTree(new URL('packages/host-sdk/src/', root), '.ts');
  assert.deepEqual(
    Object.keys(native).filter((key) => !nativeOwns(nativeSource, key)),
    [],
    'Native catalog contains entries without a native owner',
  );
  assert.deepEqual(
    Object.keys(sdk).filter((key) => !sdkOwns(sdkSource, key)),
    [],
    'SDK catalog contains entries without an SDK owner',
  );
});

test('child UI translations live in child packages, outside native and SDK catalogs', async () => {
  const native = (await json('ios/Lingrove/Resources/Localizable.xcstrings')).strings;
  const sdk = await json('packages/host-sdk/src/locales/messages.json');
  const keyboard = await json('app/polykeys/src/locales/messages.json');
  assert.equal(keyboard['键盘语言'].en, 'Keyboard language');
  assert.equal(native['键盘语言'], undefined);
  assert.equal(sdk['键盘语言'], undefined);
  assert.ok(native['应用设置']);
  for (const id of await json('modules.json')) {
    const manifest = await json(`app/${id}/manifest.json`);
    const branding = new RegExp(`\\b${escapePattern(manifest.name)}\\b`);
    for (const [owner, shared] of [
      ['Native', native],
      ['SDK', sdk],
    ]) {
      assert.doesNotMatch(JSON.stringify(shared), branding, `${owner} embeds ${id} branding`);
    }
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
      const children = (await json('modules.json')).flatMap((id) => [
        `app/${id}/src/App.vue`,
        `app/${id}/src/locales/messages.json`,
        `app/${id}/manifest.json`,
        `ios/Lingrove/Resources/BuiltinModules/${id}/index.html`,
      ]);
      for (const child of [
        ...children,
        'modules.json',
        'packages/host-sdk/src/locales/messages.json',
        'packages/host-sdk/src/ui.css',
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
  await cp(
    new URL('scripts/package-modules.mjs', root),
    path.join(directory, 'scripts/package-modules.mjs'),
  );
  await mkdir(path.join(directory, 'app/independent/src/locales'), { recursive: true });
  await writeFile(path.join(directory, 'index.html'), 'Application previews');
  await writeFile(
    path.join(directory, 'app/independent/manifest.json'),
    JSON.stringify({ id: 'independent', name: 'Independent', entry: 'index.html' }),
  );
  await writeFile(
    path.join(directory, 'app/independent/package.json'),
    '{"name":"@lingrove/independent"}',
  );
  await writeFile(path.join(directory, 'app/independent/index.html'), '<title>Independent</title>');
  const childCatalog = path.join(directory, 'app/independent/src/locales/messages.json');
  await writeFile(childCatalog, '{"child-only text":{"en":"Child","ja":"子アプリ"}}');
  // Exercise the real build and packaging scripts; replace only the external compiler and ZIP tool.
  // No SDK, native source, or native catalog is present for the first build.
  const compiler = path.join(directory, 'compile.cjs');
  await writeFile(
    compiler,
    `const fs = require('node:fs');
    fs.mkdirSync('dist/app/independent/assets', { recursive: true });
    fs.writeFileSync('dist/app/independent/index.html', 'Independent application');
    fs.copyFileSync('app/independent/src/locales/messages.json', 'dist/app/independent/assets/messages.json');`,
  );
  await writeFile(
    path.join(directory, 'scripts/stored-zip.py'),
    `require('node:fs').writeFileSync(process.argv[3], 'archive fixture');`,
  );
  const build = () =>
    spawnSync(process.execPath, ['scripts/build-modules.mjs'], {
      cwd: directory,
      env: { ...process.env, npm_execpath: compiler, PYTHON: process.execPath },
      encoding: 'utf8',
    });
  let result = build();
  assert.equal(result.status, 0, result.stderr);
  const native = path.join(directory, 'ios/Lingrove/Resources/Localizable.xcstrings');
  await assert.rejects(readFile(native), { code: 'ENOENT' });
  await writeFile(native, 'independently maintained native translations');
  await mkdir(path.join(directory, 'packages/host-sdk/src/locales'), { recursive: true });
  const sdk = path.join(directory, 'packages/host-sdk/src/locales/messages.json');
  await writeFile(sdk, 'independently maintained SDK translations');
  const updated = '{"new child-only text":{"en":"Updated","ja":"更新"}}';
  await writeFile(childCatalog, updated);
  result = build();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(native, 'utf8'), 'independently maintained native translations');
  assert.equal(await readFile(sdk, 'utf8'), 'independently maintained SDK translations');
  assert.equal(
    await readFile(
      path.join(
        directory,
        'ios/Lingrove/Resources/BuiltinModules/independent/assets/messages.json',
      ),
      'utf8',
    ),
    updated,
  );
});
