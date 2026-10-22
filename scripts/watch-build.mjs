import { realpathSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_DEBUG_PORT, ensureDebugPort } from './debug-port.mjs';

const rootFiles = new Set(['package.json', 'package-lock.json', 'modules.json', 'index.html']);
const buildScripts = new Set([
  'build-modules.mjs',
  'build-version.mjs',
  'package-modules.mjs',
  'stored-zip.py',
]);

export function isBuildInput(file) {
  const parts = file.replaceAll('\\', '/').split('/');
  if (parts.some((part) => ['node_modules', 'dist', '.git', 'tests', '__tests__'].includes(part)))
    return false;
  const name = parts.at(-1);
  if (
    name === '.DS_Store' ||
    /^(?:\.#|#)|(?:~|\.sw[opx]|\.tmp|\.bak|\.tsbuildinfo)$|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(
      name,
    )
  )
    return false;
  if (parts.length === 1) return rootFiles.has(name) || /^\.env(?:\.|$)/.test(name);
  if (parts[0] === 'scripts') return parts.length === 2 && buildScripts.has(name);
  if (parts[0] === 'packages' && parts[1] === 'host-sdk')
    return parts[2] === 'src' || (parts.length === 3 && name === 'package.json');
  if (parts[0] !== 'app' || parts.length < 2) return false;
  // Directory events also cover newly added or removed apps/source folders.
  if (parts.length === 2) return true;
  if (['src', 'public'].includes(parts[2])) return true;
  return (
    parts.length === 3 &&
    (['manifest.json', 'package.json', 'index.html'].includes(name) ||
      /^(?:vite|tsconfig)(?:\.|$)/.test(name) ||
      /^\.env(?:\.|$)/.test(name))
  );
}

// Keep builds serial; a change during a build schedules one subsequent build.
export function createBuildQueue(build, { delay = 500, onError = console.error } = {}) {
  let timer;
  let running = false;
  let pending = false;
  let stopped = false;
  async function run() {
    if (stopped || running || !pending) return;
    pending = false;
    running = true;
    try {
      await build();
    } catch (error) {
      if (!stopped) onError(error);
    } finally {
      running = false;
      if (pending && !stopped) schedule();
    }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, delay);
  }
  return {
    request({ immediate = false } = {}) {
      if (stopped) return;
      pending = true;
      if (immediate) {
        clearTimeout(timer);
        void run();
      } else schedule();
    },
    stop() {
      stopped = true;
      pending = false;
      clearTimeout(timer);
    },
  };
}

async function main() {
  const root = path.resolve(import.meta.dirname, '..');
  const args = process.argv.slice(2);
  const serve = args[0] === '--serve';
  if (serve) args.shift();
  if (
    (!serve && args.length) ||
    (args.length &&
      !(
        args.length === 2 &&
        args[0] === '--port' &&
        /^\d+$/.test(args[1]) &&
        Number(args[1]) <= 65535
      ))
  ) {
    console.error(
      `用法：npm run build:watch 或 npm run debug:serve -- --port ${DEFAULT_DEBUG_PORT}`,
    );
    process.exitCode = 1;
    return;
  }
  const port = args.length ? Number(args[1]) : DEFAULT_DEBUG_PORT;
  if (serve && !(await ensureDebugPort(port))) {
    process.exitCode = 1;
    return;
  }
  const npm = process.env.npm_execpath ? [process.execPath, process.env.npm_execpath] : ['npm'];
  const watchers = [];
  const children = new Set();
  let server;
  let stopping = false;
  const log = (message) => console.log(`[自动构建] ${message}`);
  function start(command, commandArgs) {
    // Isolate each subprocess tree so Ctrl+C also stops npm's nested builders.
    const child = spawn(command, commandArgs, {
      cwd: root,
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    });
    children.add(child);
    child.once('close', () => children.delete(child));
    return child;
  }
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    queue.stop();
    for (const watcher of watchers) watcher.close();
    for (const child of children) {
      try {
        if (process.platform === 'win32') child.kill('SIGTERM');
        else if (child.pid) process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        if (error.code !== 'ESRCH') console.error(error);
      }
    }
    process.exitCode = code;
    log('监听已停止。');
  }
  const queue = createBuildQueue(
    async () => {
      log('开始执行 npm run build…');
      await new Promise((resolve, reject) => {
        const child = start(npm[0], [...npm.slice(1), 'run', 'build']);
        child.once('error', reject);
        child.once('close', (code, signal) =>
          code === 0
            ? resolve()
            : reject(new Error(`构建未完成（${signal ?? code}）。修改文件后会自动重试。`)),
        );
      });
      if (stopping) return;
      log('构建完成，手机可点击“重新加载子应用”。继续监听修改…');
      if (serve && !server) {
        // Another process may have taken the port while the initial build ran.
        try {
          if (!(await ensureDebugPort(port))) {
            stop(1);
            return;
          }
        } catch (error) {
          console.error(error.message);
          stop(1);
          return;
        }
        if (stopping) return;
        server = start(process.env.PYTHON || 'python3', [
          path.join(root, 'scripts/serve-debug.py'),
          '--port',
          String(port),
        ]);
        server.once('error', (error) => {
          console.error(error.message);
          stop(1);
        });
        server.once('close', (code) => {
          if (!stopping) stop(code ?? 1);
        });
      }
    },
    { onError: (error) => console.error(`[自动构建] ${error.message}`) },
  );
  try {
    for (const directory of ['', 'app', 'packages', 'scripts']) {
      const watcher = watch(
        path.join(root, directory),
        { recursive: ['app', 'packages'].includes(directory) },
        (_event, filename) => {
          if (filename && isBuildInput(path.join(directory, String(filename)))) queue.request();
        },
      );
      watcher.on('error', (error) => {
        console.error(`文件监听失败：${error.message}`);
        stop(1);
      });
      watchers.push(watcher);
    }
  } catch (error) {
    console.error(`文件监听失败：${error.message}`);
    stop(1);
    return;
  }
  process.once('SIGINT', () => stop());
  process.once('SIGTERM', () => stop());
  log('正在监听子应用、共享 SDK 和构建配置；按 Ctrl+C 停止。');
  queue.request({ immediate: true });
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
