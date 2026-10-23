import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('debug builds publish a metadata-only catalog; release builds keep verified ZIP packages', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'lingrove-packaging-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    for (const name of [
      'build-version.mjs',
      'build-modules.mjs',
      'package-modules.mjs',
      'stored-zip.py',
      'verify-release.py',
      'verify-ios-modules.py',
    ]) {
      await cp(new URL(`../${name}`, import.meta.url), path.join(root, 'scripts', name));
    }
    await mkdir(path.join(root, 'app/example'), { recursive: true });
    await writeFile(path.join(root, 'modules.json'), '["example"]');
    await writeFile(path.join(root, 'index.html'), 'home');
    await writeFile(
      path.join(root, 'app/example/manifest.json'),
      JSON.stringify({
        id: 'example',
        name: 'Example',
        entry: 'index.html',
        minHostVersion: '1.3.0',
        bridgeVersion: 1,
        stateSchemaVersion: 1,
        allowedOrigins: [],
      }),
    );
    const compiler = path.join(root, 'compiler.cjs');
    await writeFile(
      compiler,
      `const fs = require('node:fs');
      fs.mkdirSync('dist/app/example', {recursive: true});
      fs.writeFileSync('dist/app/example/index.html', '<p>Example</p>');`,
    );
    const env = { ...process.env, npm_execpath: compiler, MODULE_BUILD_VERSION: '20261020' };
    delete env.MODULE_CHANNEL;
    delete env.PYTHON;
    function run(command, args) {
      const result = spawnSync(command, args, { cwd: root, env, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr || result.stdout);
    }
    const json = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
    run(process.execPath, ['scripts/build-modules.mjs']);
    const debug = (await json('dist/snapshot/catalog.snapshot.json')).modules[0];
    assert.equal(debug.name, 'Example');
    for (const key of ['downloadUrl', 'sha256', 'size'])
      assert.equal(Object.hasOwn(debug, key), false);
    await assert.rejects(readdir(path.join(root, 'dist/snapshot/packages')), { code: 'ENOENT' });
    await assert.rejects(readFile(path.join(root, 'dist/app/example/index.html')), {
      code: 'ENOENT',
    });
    assert.equal(debug.webUrl.endsWith('/snapshot/app/example/'), true);
    assert.equal(
      (await json('ios/Lingrove/Resources/BuiltinModules/example/manifest.json')).id,
      'example',
    );
    run('python3', ['scripts/verify-release.py', '--snapshot']);
    const debugProduct = path.join(root, 'debug-product');
    await cp(
      path.join(root, 'ios/Lingrove/Resources/BuiltinModules'),
      path.join(debugProduct, 'BuiltinModules'),
      { recursive: true },
    );
    run('python3', ['scripts/verify-ios-modules.py', debugProduct]);
    await writeFile(path.join(debugProduct, 'BuiltinModules/example/index.html'), 'stale HTML');
    const stale = spawnSync('python3', ['scripts/verify-ios-modules.py', debugProduct], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /stale or missing bundled files/);
    run(process.execPath, ['scripts/build-modules.mjs', '--release']);
    const release = (await json('dist/catalog.json')).modules[0];
    assert.equal(release.downloadUrl.endsWith('/packages/example-20261020.zip'), true);
    assert.equal(release.webUrl.endsWith('/app/example/'), true);
    assert.equal(release.webUrl.includes('/release/'), false);
    assert.deepEqual(await readdir(path.join(root, 'dist/packages')), ['example-20261020.zip']);
    assert.equal(
      await readFile(path.join(root, 'dist/app/example/index.html'), 'utf8'),
      '<p>Example</p>',
    );
    run('python3', ['scripts/verify-release.py']);
    const releaseProduct = path.join(root, 'release-product');
    await cp(
      path.join(root, 'ios/Lingrove/Resources/BuiltinModules'),
      path.join(releaseProduct, 'BuiltinModules'),
      { recursive: true },
    );
    run('python3', ['scripts/verify-ios-modules.py', releaseProduct]);
    // A later debug rebuild must discard old archives and the old release catalog.
    run(process.execPath, ['scripts/build-modules.mjs']);
    await assert.rejects(readdir(path.join(root, 'dist/release')), { code: 'ENOENT' });
    await assert.rejects(readdir(path.join(root, 'dist/packages')), { code: 'ENOENT' });
    await assert.rejects(readFile(path.join(root, 'dist/catalog.json')), { code: 'ENOENT' });
  } finally {
    assert.equal(path.dirname(root), path.resolve(tmpdir()));
    assert.equal(path.basename(root).startsWith('lingrove-packaging-'), true);
    await rm(root, { recursive: true, force: true });
  }
});
