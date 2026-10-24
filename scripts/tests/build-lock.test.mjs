import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { setTimeout as wait } from 'node:timers/promises';

const python = process.env.PYTHON || 'python3';
const root = new URL('../../', import.meta.url);

function start(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  const done = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, output }));
  });
  return { child, done, output: () => output };
}

async function untilOutput(process, text) {
  const deadline = Date.now() + 10000;
  while (!process.output().includes(text)) {
    assert.ok(Date.now() < deadline, `Timed out waiting for ${text}: ${process.output()}`);
    assert.equal(process.child.exitCode, null, process.output());
    await wait(20);
  }
}

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'lingrove-build-lock-'));
  const processes = [];
  const cleanups = [];
  t.after(async () => {
    for (const cleanup of cleanups) await cleanup();
    await writeFile(path.join(directory, 'release-first'), '');
    await Promise.allSettled(processes.map((process) => process.done));
    await rm(directory, { recursive: true, force: true });
  });
  await mkdir(path.join(directory, 'scripts'));
  for (const name of [
    'build-modules.mjs',
    'build-modules-worker.mjs',
    'build-version.mjs',
    'build-lock.py',
  ])
    await cp(new URL(`scripts/${name}`, root), path.join(directory, 'scripts', name));
  await mkdir(path.join(directory, 'app/example'), { recursive: true });
  await writeFile(path.join(directory, 'modules.json'), '["example"]');
  await writeFile(
    path.join(directory, 'app/example/manifest.json'),
    '{"id":"example","name":"Example","entry":"index.html"}',
  );
  await writeFile(path.join(directory, 'app/example/package.json'), '{"name":"@lingrove/example"}');
  await writeFile(path.join(directory, 'app/example/index.html'), '<title>Example</title>');
  await writeFile(
    path.join(directory, 'compiler.cjs'),
    `
    const fs = require('node:fs');
    fs.appendFileSync('events', process.env.BUILD_TEST_ID + ':compile\\n');
    fs.mkdirSync('dist', { recursive: true });
    fs.writeFileSync('dist/result', process.env.BUILD_TEST_ID);
  `,
  );
  await writeFile(
    path.join(directory, 'scripts/package-modules.mjs'),
    `
    import { appendFile, access } from 'node:fs/promises';
    import { setTimeout as wait } from 'node:timers/promises';
    const id = process.env.BUILD_TEST_ID;
    await appendFile('events', id + ':package\\n');
    console.log('packaging ' + id);
    if (id === 'first') {
      while (true) {
        try { await access('release-first'); break; }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        await wait(20);
      }
    }
    if (id === 'failure') throw new Error('fixture packaging failure');
    await appendFile('events', id + ':done\\n');
  `,
  );
  function build(id, args = []) {
    const process = start(globalThis.process.execPath, ['scripts/build-modules.mjs', ...args], {
      cwd: directory,
      env: {
        ...globalThis.process.env,
        npm_execpath: path.join(directory, 'compiler.cjs'),
        BUILD_TEST_ID: id,
      },
    });
    processes.push(process);
    return process;
  }
  return { directory, build, cleanups };
}

test(
  'manual, watcher and release builds serialize compilation and packaging across processes',
  { timeout: 20000 },
  async (t) => {
    const { directory, build } = await fixture(t);
    const first = build('first', ['--no-zip']);
    await untilOutput(first, 'packaging first');
    const second = build('second', ['--release']);
    const third = build('third');
    await Promise.all(
      [second, third].map((process) => untilOutput(process, 'Waiting for another build')),
    );
    assert.equal(await readFile(path.join(directory, 'dist/result'), 'utf8'), 'first');
    assert.equal(
      await readFile(path.join(directory, 'events'), 'utf8'),
      'first:compile\nfirst:package\n',
    );
    await writeFile(path.join(directory, 'release-first'), '');
    for (const process of [first, second, third]) {
      const result = await process.done;
      assert.equal(result.code, 0, result.output);
      assert.ok((result.output.match(/Waiting for another build/g) || []).length <= 1);
    }
    const events = (await readFile(path.join(directory, 'events'), 'utf8')).trim().split('\n');
    assert.deepEqual(events.slice(0, 3), ['first:compile', 'first:package', 'first:done']);
    for (const offset of [3, 6]) {
      const id = events[offset].split(':')[0];
      assert.deepEqual(events.slice(offset, offset + 3), [
        `${id}:compile`,
        `${id}:package`,
        `${id}:done`,
      ]);
    }
  },
);

test(
  'a packaging failure propagates its exit code and releases the build lock',
  { timeout: 20000 },
  async (t) => {
    const { build } = await fixture(t);
    const failed = await build('failure').done;
    assert.notEqual(failed.code, 0);
    assert.match(failed.output, /fixture packaging failure/);
    const result = await build('recovery').done;
    assert.equal(result.code, 0, result.output);
    assert.doesNotMatch(result.output, /Waiting for another build/);
  },
);

test(
  'the OS releases a crashed owner and cancelling a waiter preserves the active lock',
  { timeout: 20000 },
  async (t) => {
    const { directory, build, cleanups } = await fixture(t);
    const holderScript = path.join(directory, 'holder.py');
    await writeFile(
      holderScript,
      `
import pathlib, runpy, sys, time
lock = runpy.run_path(sys.argv[1])['build_lock']
with lock(pathlib.Path(sys.argv[2])):
    print('lock acquired', flush=True)
    time.sleep(30)
`,
    );
    const args = [
      holderScript,
      path.join(directory, 'scripts/build-lock.py'),
      path.join(directory, 'node_modules/.cache/lingrove/build.lock'),
    ];
    const owner = start(python, args, { cwd: directory });
    const waiter = [];
    cleanups.push(async () => {
      for (const process of [owner, ...waiter]) process.child.kill();
      await Promise.allSettled([owner, ...waiter].map((process) => process.done));
    });
    await untilOutput(owner, 'lock acquired');
    const cancelled = start(python, args, { cwd: directory });
    waiter.push(cancelled);
    await untilOutput(cancelled, 'Waiting for another build');
    cancelled.child.kill();
    await cancelled.done;
    const recovery = build('recovery');
    await untilOutput(recovery, 'Waiting for another build');
    await assert.rejects(readFile(path.join(directory, 'events')), { code: 'ENOENT' });
    owner.child.kill();
    await owner.done;
    const result = await recovery.done;
    assert.equal(result.code, 0, result.output);
  },
);
