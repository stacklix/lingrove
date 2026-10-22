import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const workflow = async (name) =>
  readFile(new URL(`../../.github/workflows/${name}`, import.meta.url), 'utf8');

function block(source, indentation, key) {
  const prefix = ' '.repeat(indentation);
  const match = new RegExp(`^${prefix}${key}:.*\\r?\\n((?:(?:${prefix} +.*|)\\r?\\n)*)`, 'm').exec(
    source,
  );
  assert.ok(match, `Missing ${key} block`);
  return match[1];
}

function steps(job) {
  return job.split(/^      - /m).slice(1);
}

test('automatic simulator checks run on PRs, while master uses the signed build workflow', async () => {
  const simulator = await workflow('ios.yml');
  const adhoc = await workflow('ios-adhoc.yml');
  const simulatorEvents = block(simulator, 0, 'on');
  const adhocEvents = block(adhoc, 0, 'on');
  assert.match(simulatorEvents, /^  pull_request:/m);
  assert.doesNotMatch(simulatorEvents, /^  push:/m);
  assert.match(simulatorEvents, /^  workflow_dispatch:/m);
  assert.match(block(adhocEvents, 2, 'push'), /branches: \[master\]/);
  assert.doesNotMatch(adhocEvents, /^  pull_request:/m);
  assert.match(adhocEvents, /^  workflow_dispatch:/m);
  assert.match(simulator, /-sdk iphonesimulator/);
  assert.doesNotMatch(adhoc, /iphonesimulator/);
});

test('PR checks keep application and native tests before the simulator build', async () => {
  const job = block(await workflow('ios.yml'), 2, 'ios');
  const ordered = steps(job);
  const install = ordered.findIndex((step) => /run: npm ci/.test(step));
  const checks = ordered.findIndex((step) => step.includes('scripts/test-native.sh'));
  const compile = ordered.findIndex((step) => step.includes('xcodebuild -project'));
  assert.ok(install >= 0 && checks > install && compile > checks);
  for (const command of [
    'npm run typecheck',
    'npm test',
    'python3 scripts/tests/test-ios-distribution.py',
  ]) {
    assert.ok(ordered[checks].includes(command), command);
  }
  assert.match(ordered[checks], /set -euo pipefail/);
  assert.doesNotMatch(ordered[checks], /continue-on-error:|\|\|\s*true|^\s*if:/m);
  assert.doesNotMatch(job, /npm run (?:check|build(?:\s|:))/);
});

test('rapid-development publishing builds and verifies artifacts without running tests', async () => {
  for (const file of ['ios-adhoc.yml', 'build-gh-pages.yml']) {
    const source = await workflow(file);
    assert.doesNotMatch(
      source,
      /npm (?:test|run (?:test|check|typecheck))|node --test|scripts\/tests\/|scripts\/test-native\.sh/,
    );
    assert.match(source, /run: npm ci/);
    assert.match(source, /verify-(?:ios-modules|pages-build)/);
  }
});

test('signed publishing still requires a successful archive and artifact upload', async () => {
  const source = await workflow('ios-adhoc.yml');
  const job = block(source, 2, 'build');
  const ordered = steps(job);
  const install = ordered.findIndex((step) => /run: npm ci/.test(step));
  const signing = ordered.findIndex((step) => step.includes('id: signing'));
  const archive = ordered.findIndex((step) => step.includes('xcodebuild -project'));
  const upload = ordered.findIndex((step) => step.includes('actions/upload-artifact@'));
  assert.ok(install >= 0 && signing > install && archive > signing && upload > archive);
  for (const index of [signing, archive, upload]) {
    assert.doesNotMatch(ordered[index], /continue-on-error:|^\s*if:/m);
  }
  const publish = block(source, 2, 'publish');
  assert.match(publish, /^    needs: build$/m);
  assert.doesNotMatch(publish, /^    (?:if|continue-on-error):/m);
});
