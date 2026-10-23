import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { verifyPagesSource } from '../verify-pages-source.mjs';

test('workflow publishing checks the source without requesting another build', async () => {
  const calls = [];
  await verifyPagesSource({
    repository: 'owner/repo',
    api: async (...args) => {
      calls.push(args);
      return { build_type: 'workflow' };
    },
  });
  assert.deepEqual(calls, [['repos/owner/repo/pages', 'GET']]);
});

test('branch publishing must be disabled before writing or deploying the new site', async () => {
  await assert.rejects(
    verifyPagesSource({
      repository: 'owner/repo',
      api: async () => ({ build_type: 'legacy', source: { branch: 'gh-pages' } }),
    }),
    /Source to GitHub Actions.*https:\/\/github.com\/owner\/repo\/settings\/pages/,
  );
});

test('source lookup errors stop publication', async () => {
  await assert.rejects(
    verifyPagesSource({
      repository: 'owner/repo',
      api: async () => { throw new Error('Pages API unavailable'); },
    }),
    /Pages API unavailable/,
  );
});

test('the shared publisher uploads the full merged site and deploys it exactly once', async () => {
  const action = await readFile(new URL('../../.github/actions/publish-pages/action.yml', import.meta.url), 'utf8');
  const check = action.indexOf('run: node scripts/verify-pages-source.mjs');
  const merge = action.indexOf('run: node scripts/publish-pages-tree.mjs');
  const upload = action.indexOf('uses: actions/upload-pages-artifact@');
  const deploy = action.indexOf('uses: actions/deploy-pages@');
  assert.ok(check >= 0 && merge > check && upload > merge && deploy > upload);
  assert.equal(action.match(/uses: actions\/deploy-pages@/g)?.length, 1);
  const exported = /^        PAGES_ARTIFACT_DIR: (.+)$/m.exec(action)?.[1];
  const uploaded = /^        path: (.+)$/m.exec(action)?.[1];
  assert.ok(exported);
  assert.equal(exported, uploaded);
  assert.doesNotMatch(action, /pages\/builds|verify-pages-build|continue-on-error/);
});
