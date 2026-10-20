import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moduleBuildVersion } from '../build-version.mjs';

test('build dates use Shanghai time, including midnight and year boundaries', () => {
  const original = process.env.MODULE_BUILD_VERSION;
  delete process.env.MODULE_BUILD_VERSION;
  try {
    assert.equal(moduleBuildVersion(new Date('2026-10-20T15:59:59Z')), '20261020');
    assert.equal(moduleBuildVersion(new Date('2026-10-20T16:00:00Z')), '20261021');
    assert.equal(moduleBuildVersion(new Date('2026-12-31T16:00:00Z')), '20270101');
    process.env.MODULE_BUILD_VERSION = '20240229';
    assert.equal(moduleBuildVersion(new Date('2026-01-01T00:00:00Z')), '20240229');
    for (const invalid of ['20260229', '20261301', '20260431', '00000101', '1.2.0', '../20261020']) {
      process.env.MODULE_BUILD_VERSION = invalid;
      assert.throws(() => moduleBuildVersion(), /valid yyyyMMdd/);
    }
  } finally {
    if (original === undefined) delete process.env.MODULE_BUILD_VERSION;
    else process.env.MODULE_BUILD_VERSION = original;
  }
});
