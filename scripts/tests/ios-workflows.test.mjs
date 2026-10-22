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

test('both iOS builds test before compiling and let Xcode build web resources once', async () => {
  for (const [file, jobName] of [
    ['ios.yml', 'ios'],
    ['ios-adhoc.yml', 'build'],
  ]) {
    const job = block(await workflow(file), 2, jobName);
    const ordered = steps(job);
    const install = ordered.findIndex((step) => /run: npm ci/.test(step));
    const checks = ordered.findIndex((step) => step.includes('scripts/test-native.sh'));
    const compile = ordered.findIndex((step) => step.includes('xcodebuild -project'));
    assert.ok(install >= 0 && checks > install && compile > checks, file);
    for (const command of [
      'npm run typecheck',
      'npm test',
      'python3 scripts/tests/test-ios-distribution.py',
    ]) {
      assert.ok(ordered[checks].includes(command), `${file}: ${command}`);
    }
    assert.match(ordered[checks], /set -euo pipefail/);
    assert.doesNotMatch(ordered[checks], /continue-on-error:|\|\|\s*true|^\s*if:/m);
    assert.doesNotMatch(ordered[compile], /continue-on-error:|^\s*if:/m);
    assert.doesNotMatch(job, /npm run (?:check|build(?:\s|:))/);
    assert.doesNotMatch(job, /^    (?:continue-on-error|if):.*(?:true|always\()/m);
  }
});

test('signing, archive and publishing cannot bypass failed checks', async () => {
  const source = await workflow('ios-adhoc.yml');
  const job = block(source, 2, 'build');
  const ordered = steps(job);
  const checks = ordered.findIndex((step) => step.includes('scripts/test-native.sh'));
  const signing = ordered.findIndex((step) => step.includes('id: signing'));
  const archive = ordered.findIndex((step) => step.includes('xcodebuild -project'));
  const upload = ordered.findIndex((step) => step.includes('actions/upload-artifact@'));
  assert.ok(checks >= 0 && signing > checks && archive > signing && upload > archive);
  for (const index of [signing, archive, upload]) {
    assert.doesNotMatch(ordered[index], /continue-on-error:|^\s*if:/m);
  }
  const publish = block(source, 2, 'publish');
  assert.match(publish, /^    needs: build$/m);
  assert.doesNotMatch(publish, /^    (?:if|continue-on-error):/m);
});
