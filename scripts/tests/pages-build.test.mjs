import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyPagesBuild } from '../verify-pages-build.mjs';

function fixture(states) {
  const calls = [];
  let waits = 0;
  return {
    calls,
    get waits() { return waits; },
    options: {
      repository: 'owner/repo', commit: 'target', attempts: states.length,
      log: () => {},
      wait: async () => { waits++; },
      api: async (endpoint, method) => {
        calls.push([endpoint, method]);
        return method === 'POST' ? { url: 'cancelled-build' } : states.shift();
      },
    },
  };
}

test('Pages follows a replacement build after the original request errors', async () => {
  const f = fixture([
    { commit: 'target', status: 'errored', error: { message: 'Page build failed.' } },
    { commit: 'target', status: 'building' },
    { commit: 'target', status: 'built' },
  ]);
  await verifyPagesBuild(f.options);
  assert.equal(f.waits, 2);
  assert.deepEqual(f.calls, [
    ['repos/owner/repo/pages/builds', 'POST'],
    ...Array.from({ length: 3 }, () => ['repos/owner/repo/pages/builds/latest', 'GET']),
  ]);
});

test('a successful build for another commit cannot confirm publication', async () => {
  const f = fixture([{ commit: 'previous', status: 'built' }]);
  await assert.rejects(verifyPagesBuild(f.options), /Timed out.*target.*previous built/);
});

test('persistent Pages failures fail verification with the service error', async () => {
  const f = fixture(Array.from({ length: 3 }, () => ({
    commit: 'target', status: 'errored', error: { message: 'Page build failed.' },
  })));
  await assert.rejects(verifyPagesBuild(f.options), /Timed out.*Page build failed/);
  assert.equal(f.waits, 2);
});
