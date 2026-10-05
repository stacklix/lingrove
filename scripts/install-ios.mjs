#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const usage = `构建并安装当前 Lingrove 到 iPhone/iPad（Debug）。

用法：
  npm run ios:install
  npm run ios:install -- --list
  npm run ios:install -- --device <设备名称、UDID 或 Identifier>
  npm run ios:install -- --team <Apple Development Team ID>

需要完整 Xcode、已配置的开发签名，以及已信任电脑并开启开发者模式的设备。
设备需通过 USB 或 Xcode 无线调试连接。多台已配对设备时请使用 --device。
构建会自动更新内置子应用；产物保留在 build/ios-device/。`;

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw new Error(`无法运行 ${command}：${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} 执行失败（${result.signal ?? result.status}），已停止后续操作。`);
}

function main() {
  const args = process.argv.slice(2);
  let deviceQuery;
  let team;
  let listOnly = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage);
      return;
    }
    if (arg === '--list') listOnly = true;
    else if (arg === '--device' || arg === '--team') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} 缺少参数。`);
      if (arg === '--device') deviceQuery = value;
      else team = value;
    } else throw new Error(`未知参数：${arg}\n${usage}`);
  }
  if (process.platform !== 'darwin') throw new Error('iOS 安装脚本需要在装有 Xcode 的 macOS 上运行。');
  const temp = mkdtempSync(join(tmpdir(), 'lingrove-install-'));
  try {
    const devicesFile = join(temp, 'devices.json');
    run('xcrun', ['devicectl', 'list', 'devices', '--timeout', '30', '--json-output', devicesFile]);
    const payload = JSON.parse(readFileSync(devicesFile, 'utf8'));
    const devices = (payload.result?.devices ?? []).filter((device) =>
      ['iPhone', 'iPad'].includes(device.hardwareProperties?.deviceType) &&
      device.hardwareProperties?.reality === 'physical' &&
      device.connectionProperties?.pairingState === 'paired',
    );
    if (listOnly) return;
    const matches = deviceQuery
      ? devices.filter((device) => [device.identifier, device.hardwareProperties.udid, device.deviceProperties?.name].includes(deviceQuery))
      : devices;
    if (!matches.length) throw new Error('未找到匹配的已配对 iPhone/iPad。请连接并解锁设备、信任此电脑，然后在 Xcode 的 Devices and Simulators 中确认连接。');
    if (matches.length > 1) throw new Error('有多台匹配设备，请用 --device 指定上方列表中的唯一 Identifier。');
    const device = matches[0];
    if (device.deviceProperties?.developerModeStatus === 'disabled') throw new Error('请先在手机“设置 → 隐私与安全性 → 开发者模式”开启开发者模式。');
    const udid = device.hardwareProperties.udid;
    if (!udid) throw new Error('设备缺少 UDID，请在 Xcode 中重新连接设备后重试。');
    console.log(`\n正在为 ${device.deviceProperties?.name ?? udid} 构建 Debug 应用…`);
    const derivedData = join(root, 'build', 'ios-device');
    run('xcodebuild', [
      '-project', join(root, 'ios', 'Lingrove.xcodeproj'),
      '-scheme', 'Lingrove', '-configuration', 'Debug', '-sdk', 'iphoneos',
      '-destination', `id=${udid}`, '-derivedDataPath', derivedData,
      '-allowProvisioningUpdates', '-allowProvisioningDeviceRegistration',
      ...(team ? [`DEVELOPMENT_TEAM=${team}`] : []), 'build',
    ]);
    const app = join(derivedData, 'Build', 'Products', 'Debug-iphoneos', 'Lingrove.app');
    if (!existsSync(app)) throw new Error(`未找到构建产物：${app}`);
    run('xcrun', ['devicectl', 'device', 'install', 'app', '--device', device.identifier, app, '--timeout', '120']);
    console.log(`\n已安装 Lingrove（Debug）到 ${device.deviceProperties?.name ?? udid}。可在手机上打开应用。\n产物：${app}`);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(`\n安装失败：${error.message}`);
  process.exitCode = 1;
}
