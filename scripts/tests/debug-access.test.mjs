import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('debug resources accept all sources without Token authentication', () => {
  const result = spawnSync(
    process.env.PYTHON || 'python3',
    ['-B', fileURLToPath(new URL('test-debug-access.py', import.meta.url))],
    { encoding: 'utf8', timeout: 20000 },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout || String(result.error));
});
