import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';

test('both channels publish matching ZIP and HTML resources with bundled package hashes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'lingrove-packaging-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    for (const name of [
      'build-version.mjs',
      'build-modules.mjs',
      'build-modules-worker.mjs',
      'build-lock.py',
      'package-modules.mjs',
      'stored-zip.py',
      'verify-release.py',
      'verify-ios-modules.py',
      'serve-debug.py',
    ]) {
      await cp(new URL(`../${name}`, import.meta.url), path.join(root, 'scripts', name));
    }
    await mkdir(path.join(root, 'app/example'), { recursive: true });
    await writeFile(path.join(root, 'modules.json'), '["example"]');
    await writeFile(path.join(root, 'index.html'), 'home');
    await writeFile(path.join(root, 'app/example/package.json'), '{"name":"@lingrove/example"}');
    await writeFile(path.join(root, 'app/example/index.html'), '<title>Example</title>');
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
      assert.equal(Object.hasOwn(debug, key), true);
    assert.deepEqual(await readdir(path.join(root, 'dist/snapshot/packages')), [
      'example-20261020.zip',
    ]);
    assert.equal(debug.downloadUrl.endsWith('/snapshot/packages/example-20261020.zip'), true);
    assert.deepEqual(await json('ios/Lingrove/Resources/BuiltinModuleHashes.json'), {
      example: debug.sha256,
    });
    await assert.rejects(readFile(path.join(root, 'dist/app/example/index.html')), {
      code: 'ENOENT',
    });
    assert.equal(debug.webUrl.endsWith('/snapshot/app/example/index.html'), true);
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
    await cp(
      path.join(root, 'ios/Lingrove/Resources/BuiltinModuleHashes.json'),
      path.join(debugProduct, 'BuiltinModuleHashes.json'),
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
    assert.equal(release.webUrl.endsWith('/app/example/index.html'), true);
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
    await cp(
      path.join(root, 'ios/Lingrove/Resources/BuiltinModuleHashes.json'),
      path.join(releaseProduct, 'BuiltinModuleHashes.json'),
    );
    run('python3', ['scripts/verify-ios-modules.py', releaseProduct]);
    // A later debug rebuild must discard old archives and the old release catalog.
    run(process.execPath, ['scripts/build-modules.mjs']);
    await assert.rejects(readdir(path.join(root, 'dist/release')), { code: 'ENOENT' });
    await assert.rejects(readdir(path.join(root, 'dist/packages')), { code: 'ENOENT' });
    await assert.rejects(readFile(path.join(root, 'dist/catalog.json')), { code: 'ENOENT' });
    // The local watcher must be able to build without invoking the ZIP tool.
    await rm(path.join(root, 'scripts/stored-zip.py'));
    run(process.execPath, ['scripts/build-modules.mjs', '--no-zip']);
    const local = (await json('dist/snapshot/catalog.snapshot.json')).modules[0];
    for (const key of ['downloadUrl', 'sha256', 'size'])
      assert.equal(Object.hasOwn(local, key), false);
    assert.equal(local.webUrl.endsWith('/snapshot/app/example/index.html'), true);
    assert.deepEqual(await json('ios/Lingrove/Resources/BuiltinModuleHashes.json'), {});
    await assert.rejects(readdir(path.join(root, 'dist/snapshot/packages')), { code: 'ENOENT' });
    run('python3', ['scripts/verify-release.py', '--snapshot']);
    run('python3', ['scripts/verify-ios-modules.py', 'ios/Lingrove/Resources']);
    const invalid = spawnSync(
      process.execPath,
      ['scripts/build-modules.mjs', '--release', '--no-zip'],
      { cwd: root, env, encoding: 'utf8' },
    );
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /only supported for local snapshot/);
    for (const token of ['', 'abc12', 'abcd123', 'abc-12', '中文1234']) {
      const rejected = spawnSync('python3', ['scripts/serve-debug.py', '--port', '0'], {
        cwd: root,
        env: { ...env, PYTHONUTF8: '1', LINGROVE_DEBUG_TOKEN: token },
        encoding: 'utf8',
      });
      assert.notEqual(rejected.status, 0);
      assert.match(rejected.stderr, /exactly 6 ASCII letters or digits/);
    }
    for (const configuredToken of ['Ab12Cd', '123456', 'ABCdef', undefined]) {
      const serverEnv = { ...env, PYTHONUTF8: '1' };
      delete serverEnv.LINGROVE_DEBUG_LAN_CIDRS;
      delete serverEnv.LINGROVE_DEBUG_PROXY_CIDRS;
      if (configuredToken === undefined) delete serverEnv.LINGROVE_DEBUG_TOKEN;
      else serverEnv.LINGROVE_DEBUG_TOKEN = configuredToken;
      const server = spawn('python3', ['scripts/serve-debug.py', '--port', '0'], {
        cwd: root,
        env: serverEnv,
      });
      try {
        const { origin, token } = await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('Debug server startup timed out')),
            10000,
          );
          let output = '';
          server.once('error', reject);
          server.once('exit', (code) => {
            clearTimeout(timeout);
            reject(new Error(`Debug server exited: ${code}`));
          });
          server.stdout.on('data', (chunk) => {
            output += chunk;
            const port = /http:\/\/localhost:(\d+)/.exec(output)?.[1];
            const token = /Token：([A-Za-z0-9]{6})\r?\n/.exec(output)?.[1];
            if (port && token) {
              clearTimeout(timeout);
              resolve({ origin: `http://127.0.0.1:${port}`, token });
            }
          });
        });
        assert.match(token, /^[A-Za-z0-9]{6}$/);
        if (configuredToken !== undefined) assert.equal(token, configuredToken);
        for (const target of [
          '/',
          '/snapshot/catalog.snapshot.json',
          '/snapshot/app/example/index.html',
          '/missing',
        ]) {
          for (const method of ['GET', 'HEAD', 'POST']) {
            for (const headers of [{}, { 'Stack-Pass': 'incorrect' }]) {
              const denied = await fetch(`${origin}${target}`, { method, headers });
              assert.equal(denied.status, 401);
              assert.equal(
                denied.headers.get('www-authenticate'),
                'Stack-Pass realm="Lingrove Debug"',
              );
              assert.equal(denied.headers.get('cache-control'), 'no-store');
              assert.equal(await denied.text(), '');
            }
          }
        }
        const queryToken = await fetch(`${origin}/snapshot/catalog.snapshot.json?token=${token}`);
        assert.equal(queryToken.status, 401);
        for (const headers of [
          { Authorization: `Bearer ${token}` },
          { 'Stack-Pass': `Bearer ${token}` },
          { 'Stack-Pass': `${token}, ${token}` },
        ]) {
          const denied = await fetch(`${origin}/snapshot/catalog.snapshot.json`, { headers });
          assert.equal(denied.status, 401);
        }
        const authenticated = (target, options = {}) =>
          fetch(`${origin}${target}`, {
            ...options,
            headers: { 'Stack-Pass': token },
          });
        if (token !== token.toLowerCase()) {
          const wrongCase = await fetch(`${origin}/snapshot/catalog.snapshot.json`, {
            headers: { 'Stack-Pass': token.toLowerCase() },
          });
          assert.equal(wrongCase.status, 401);
        }
        const catalog = await authenticated('/snapshot/catalog.snapshot.json').then((response) =>
          response.json(),
        );
        assert.equal(Object.hasOwn(catalog.modules[0], 'downloadUrl'), false);
        const html = await authenticated('/snapshot/app/example/index.html');
        assert.equal(html.status, 200);
        assert.equal(html.headers.get('x-lingrove-debug-auth'), 'Stack-Pass');
        const lowercaseHeader = await fetch(`${origin}/snapshot/catalog.snapshot.json`, {
          headers: { 'stack-pass': token },
        });
        assert.equal(lowercaseHeader.status, 200);
        assert.equal(await html.text(), '<p>Example</p>');
        const directoryIndex = await authenticated('/snapshot/app/example/');
        assert.equal(directoryIndex.status, 200);
        assert.equal(await directoryIndex.text(), '<p>Example</p>');
        for (const method of ['GET', 'HEAD']) {
          const listing = await authenticated('/snapshot/app/?sort=name', { method });
          assert.equal(listing.status, 403);
          assert.equal(listing.headers.get('cache-control'), 'no-store');
          assert.doesNotMatch(await listing.text(), /href=|example/);
        }
      } finally {
        if (server.exitCode === null && server.signalCode === null) {
          const closed = once(server, 'close');
          server.kill();
          await closed;
        }
      }
    }
  } finally {
    assert.equal(path.dirname(root), path.resolve(tmpdir()));
    assert.equal(path.basename(root).startsWith('lingrove-packaging-'), true);
    await rm(root, { recursive: true, force: true });
  }
});
