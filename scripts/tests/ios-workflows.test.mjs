import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { format } from 'prettier';

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

test('publishing workflows and the shared action are valid YAML', async () => {
  for (const file of ['ios.yml', 'ios-adhoc.yml', 'build-gh-pages.yml']) {
    await format(await workflow(file), { parser: 'yaml' });
  }
  await format(
    await readFile(new URL('../../.github/actions/publish-pages/action.yml', import.meta.url), 'utf8'),
    { parser: 'yaml' },
  );
});

test('PR and master check Release isolation while the signed master artifact remains Debug', async () => {
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
  const signedBuild = block(adhoc, 2, 'build');
  assert.doesNotMatch(signedBuild, /iphonesimulator/);
  assert.match(signedBuild, /CONFIGURATION: Debug/);
  for (const release of [block(adhoc, 2, 'release-check'), block(simulator, 2, 'release')]) {
    assert.match(release, /-configuration Release/);
    assert.match(release, /verify-ios-release.py/);
    assert.doesNotMatch(release, /continue-on-error/);
  }
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
    const workflowSource = await workflow(file);
    // Release isolation runs independently; the publishing path keeps its fast checks.
    const source =
      file === 'ios-adhoc.yml'
        ? block(workflowSource, 2, 'build') + block(workflowSource, 2, 'publish')
        : workflowSource;
    assert.doesNotMatch(
      source,
      /npm (?:test|run (?:test|check|typecheck))|node --test|scripts\/tests\/|scripts\/test-native\.sh/,
    );
    assert.match(source, /run: npm ci/);
    assert.match(source, /verify-ios-modules|uses: \.\/\.github\/actions\/publish-pages/);
  }
});

test('web and iOS use one shared publisher while holding the same lock through deployment', async () => {
  const web = await workflow('build-gh-pages.yml');
  const ios = await workflow('ios-adhoc.yml');
  const webJob = block(web, 2, 'build-and-publish');
  const iosJob = block(ios, 2, 'publish');
  for (const scope of [web, iosJob]) {
    assert.match(block(scope, scope === web ? 0 : 4, 'concurrency'), /group: publish-gh-pages/);
    assert.match(scope, /cancel-in-progress: false/);
  }
  for (const job of [webJob, iosJob]) {
    const permissions = block(job, 4, 'permissions');
    assert.match(permissions, /contents: write/);
    assert.match(permissions, /pages: write/);
    assert.match(permissions, /id-token: write/);
    const environment = block(job, 4, 'environment');
    assert.match(environment, /name: github-pages/);
    assert.match(environment, /steps\.publish\.outputs\.page_url/);
    assert.equal(job.match(/uses: \.\/\.github\/actions\/publish-pages/g)?.length, 1);
    assert.doesNotMatch(job, /verify-pages-build|pages\/builds|actions\/deploy-pages@/);
  }
  assert.match(webJob, /github\.ref_type == 'tag' && 'release' \|\| 'snapshot'/);
  assert.match(iosJob, /channel: ios/);
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
