import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as wait } from 'node:timers/promises';
import { createBuildQueue, isBuildInput } from '../watch-build.mjs';

test('watches build inputs, including new apps and shared locales, while ignoring generated files', () => {
  for (const file of [
    'app/verso/src/App.vue',
    'app/verso/src/new-folder',
    'app/verso/src/new.ts',
    'app/new-app',
    'app/new-app/public/icon.png',
    'app/verso/manifest.json',
    'app/verso/vite.config.ts',
    'app/verso/tsconfig.json',
    'app/verso/.env.local',
    'app/verso/index.html',
    'app/verso/package.json',
    'packages/host-sdk/src/locales/messages.json',
    'packages/host-sdk/package.json',
    'modules.json',
    'index.html',
    'package.json',
    'package-lock.json',
    'scripts/build-modules.mjs',
    'scripts/stored-zip.py',
  ])
    assert.equal(isBuildInput(file), true, file);
  for (const file of [
    'dist/app/verso/assets/index.js',
    'dist/snapshot/app/verso/assets/index.js',
    'dist/packages/verso.zip',
    'ios/Lingrove/Resources/BuiltinModules/verso/index.html',
    'ios/Lingrove/Resources/Localizable.xcstrings',
    'node_modules/vue/package.json',
    'app/verso/node_modules/.vite-temp/config.js',
    '.git/index',
    'app/verso/README.md',
    'app/verso/tests/app.test.ts',
    'app/verso/src/__tests__/app.ts',
    'app/verso/src/App.test.ts',
    'app/verso/src/.App.vue.swp',
    'app/verso/src/App.vue~',
    'app/verso/src/.DS_Store',
    'app/verso/tsconfig.tsbuildinfo',
    'scripts/tests/watch-build.test.mjs',
    'scripts/watch-build.mjs',
  ])
    assert.equal(isBuildInput(file), false, file);
});

test('debounces consecutive saves into one build', async (t) => {
  let count = 0;
  const queue = createBuildQueue(
    async () => {
      count++;
    },
    { delay: 15 },
  );
  t.after(() => queue.stop());
  queue.request();
  queue.request();
  queue.request();
  assert.equal(count, 0);
  await wait(60);
  assert.equal(count, 1);
});

test('queues exactly one follow-up build for changes received during a running build', async (t) => {
  let count = 0;
  let finish;
  const queue = createBuildQueue(
    async () => {
      count++;
      if (count === 1)
        await new Promise((resolve) => {
          finish = resolve;
        });
    },
    { delay: 15 },
  );
  t.after(() => queue.stop());
  queue.request({ immediate: true });
  queue.request();
  queue.request();
  await wait(60);
  assert.equal(count, 1);
  finish();
  await wait(60);
  assert.equal(count, 2);
  await wait(30);
  assert.equal(count, 2);
});

test('continues accepting changes after a failed build without retrying in a loop', async (t) => {
  let count = 0;
  const errors = [];
  const queue = createBuildQueue(
    async () => {
      count++;
      if (count === 1) throw new Error('invalid source');
    },
    { delay: 15, onError: (error) => errors.push(error.message) },
  );
  t.after(() => queue.stop());
  queue.request({ immediate: true });
  await wait(40);
  assert.deepEqual(errors, ['invalid source']);
  assert.equal(count, 1);
  queue.request();
  await wait(40);
  assert.equal(count, 2);
});

test('stopping discards pending builds even if the active build finishes later', async () => {
  let count = 0;
  let finish;
  const queue = createBuildQueue(
    async () => {
      count++;
      await new Promise((resolve) => {
        finish = resolve;
      });
    },
    { delay: 15 },
  );
  queue.request({ immediate: true });
  queue.request();
  queue.stop();
  finish();
  queue.request();
  await wait(40);
  assert.equal(count, 1);
});
