import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const read = (file) => readFile(new URL(file, root), 'utf8');

// All host conditional compilation currently uses DEBUG. Fail closed if a new
// condition is introduced so this check never silently misinterprets a branch.
function compiledSource(source, debug) {
  const stack = [];
  let active = true;
  const lines = [];
  for (const line of source.split(/\r?\n/)) {
    const directive = line.trim();
    if (directive.startsWith('#if ')) {
      assert.equal(directive, '#if DEBUG');
      stack.push({ parent: active, condition: debug });
      active = active && debug;
    } else if (directive === '#else') {
      const branch = stack.at(-1);
      assert.ok(branch);
      active = branch.parent && !branch.condition;
    } else if (directive === '#endif') {
      assert.ok(stack.length);
      active = stack.pop().parent;
    } else {
      assert.ok(!directive.startsWith('#elseif'));
      if (active) lines.push(line);
    }
  }
  assert.equal(stack.length, 0, 'unbalanced conditional compilation');
  return lines.join('\n');
}

async function swiftSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
        if (entry.isDirectory() && entry.name !== 'Resources') return swiftSources(url);
        return entry.isFile() && entry.name.endsWith('.swift') ? readFile(url, 'utf8') : '';
      }),
    )
  ).join('\n');
}

test('Release compilation excludes debug implementations while Debug retains them', async () => {
  const source = await swiftSources(new URL('ios/Lingrove/', root));
  const release = compiledSource(source, false);
  const debug = compiledSource(source, true);
  for (const marker of [
    'DebugServer',
    'DebugAddressRow',
    'GitHubBuildStatus',
    'ModuleDeveloperDetailsView',
    'snapshotCatalogURL',
    'resourceModePreferenceKey',
    'ModuleReloadRecord',
    'modules.reloadHistory',
    'module-refresh',
    'isInspectable',
    'debugToken',
    'Stack-Pass',
    'X-Lingrove-Debug-Auth',
    'debugResourceBase',
    'debugResourceTasks',
    'loadDebugResource',
  ]) {
    assert.ok(debug.includes(marker), `Debug lost ${marker}`);
    assert.ok(!release.includes(marker), `Release still compiles ${marker}`);
  }
  assert.ok(release.includes('url.scheme == "lingrove"'));
  assert.ok(release.includes('remoteEntryURL'));
  assert.ok(release.includes('usingLocalFallback'));
  assert.ok(release.includes('return catalogURL'));
  const project = await read('ios/Lingrove.xcodeproj/project.pbxproj');
  assert.doesNotMatch(project, /HostConfig.json in Resources/);
  for (const file of ['DebugServer.swift', 'DebugViews.swift']) {
    assert.ok(project.includes(`${file} in Sources`));
  }
  assert.match(project, /EXCLUDED_SOURCE_FILE_NAMES = \(\s*DebugServer.swift,\s*DebugViews.swift,/);
  assert.match(
    await read('scripts/generate-xcode.rb'),
    /EXCLUDED_SOURCE_FILE_NAMES.*DebugServer.swift.*DebugViews.swift/,
  );
});

test('Release packaging selects formal configuration and CI verifies actual binary', async () => {
  assert.deepEqual(JSON.parse(await read('ios/Lingrove/Resources/HostConfig.release.json')), {
    catalogURL: 'https://lingrove.stackli.me/catalog.json',
  });
  const embed = await read('scripts/embed-ios-modules.sh');
  assert.match(
    embed,
    /Release[\s\S]*build:release[\s\S]*HostConfig.release.json[\s\S]*else[\s\S]*HostConfig.json/,
  );
  const workflow = await read('.github/workflows/ios.yml');
  assert.match(workflow, /-configuration Release/);
  assert.match(workflow, /verify-ios-release.py .*Release-iphonesimulator\/Lingrove.app/);
  assert.match(await read('.github/workflows/ios-adhoc.yml'), /CONFIGURATION: Debug/);
});

test('Release artifact verifier rejects debug executable and debug resource configuration', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lingrove-release-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const info = (extra = '') =>
    `<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>Lingrove</string>${extra}</dict></plist>`;
  await writeFile(path.join(directory, 'Info.plist'), info());
  const config = { catalogURL: 'https://lingrove.stackli.me/catalog.json' };
  await writeFile(path.join(directory, 'HostConfig.json'), JSON.stringify(config));
  await writeFile(path.join(directory, 'Lingrove'), 'local application code');
  const verify = () =>
    spawnSync(
      'python3',
      [fileURLToPath(new URL('scripts/verify-ios-release.py', root)), directory],
      { encoding: 'utf8' },
    );
  assert.equal(verify().status, 0);
  for (const marker of ['DebugServer', 'Stack-Pass', 'X-Lingrove-Debug-Auth']) {
    await writeFile(path.join(directory, 'Lingrove'), `code ${marker} code`);
    assert.match(verify().stderr, /Release executable contains debug code/);
  }
  await writeFile(path.join(directory, 'Lingrove'), 'local application code');
  await writeFile(
    path.join(directory, 'HostConfig.json'),
    JSON.stringify({ ...config, snapshotCatalogURL: 'debug' }),
  );
  assert.match(verify().stderr, /formal catalog configuration/);
  await writeFile(path.join(directory, 'HostConfig.json'), JSON.stringify(config));
  await writeFile(
    path.join(directory, 'Info.plist'),
    info('<key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>'),
  );
  assert.match(verify().stderr, /development network exceptions/);
});
