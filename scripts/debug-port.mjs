import { execFile } from 'node:child_process';
import { createServer } from 'node:net';
import { createInterface } from 'node:readline';
import { setTimeout as wait } from 'node:timers/promises';
import { promisify } from 'node:util';

export const DEFAULT_DEBUG_PORT = 8000;
const execute = promisify(execFile);

export function isPortFree(port) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', (error) => (error.code === 'EADDRINUSE' ? resolve(false) : reject(error)));
    probe.listen({ host: '0.0.0.0', port, exclusive: true }, () => {
      probe.close((error) => (error ? reject(error) : resolve(true)));
    });
  });
}

export async function findPortProcesses(port) {
  if (process.platform === 'win32') {
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid TCP port');
    const script = `
      $ErrorActionPreference = 'Stop'
      [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
      $listeners = @(Get-NetTCPConnection -State Listen | Where-Object LocalPort -eq ${port} | Select-Object -ExpandProperty OwningProcess -Unique)
      $records = @(foreach ($listenerId in $listeners) {
        $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$listenerId"
        if ($null -eq $processInfo) { continue }
        $owner = Invoke-CimMethod -InputObject $processInfo -MethodName GetOwner
        if ($owner.ReturnValue -ne 0 -or -not $processInfo.CommandLine) { throw "Cannot identify PID $listenerId" }
        [PSCustomObject]@{
          pid = [int]$listenerId
          user = "$($owner.Domain)\\$($owner.User)"
          started = $processInfo.CreationDate.ToUniversalTime().ToString('o')
          command = $processInfo.CommandLine
        }
      })
      ConvertTo-Json -InputObject $records -Compress
    `;
    try {
      const { stdout } = await execute(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        { windowsHide: true },
      );
      return JSON.parse(stdout.trim());
    } catch (error) {
      throw new Error(`无法查询端口 ${port} 的占用进程：${error.message}`);
    }
  }
  let stdout;
  try {
    ({ stdout } = await execute('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp']));
  } catch (error) {
    if (error.code === 1 && !error.stdout?.trim() && !error.stderr?.trim()) return [];
    throw new Error(`无法查询端口 ${port} 的占用进程：${error.message}`);
  }
  const pids = [...new Set([...stdout.matchAll(/^p(\d+)$/gm)].map((match) => Number(match[1])))];
  const processes = await Promise.all(
    pids.map(async (pid) => {
      try {
        const { stdout: details } = await execute(
          'ps',
          ['-ww', '-p', String(pid), '-o', 'pid=,user=,lstart=,command='],
          {
            env: { ...process.env, LC_ALL: 'C' },
          },
        );
        const match = details.match(
          /^\s*(\d+)\s+(\S+)\s+(\w{3}\s+\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.+)$/m,
        );
        if (!match) throw new Error(`无法读取 PID ${pid} 的完整进程信息`);
        return { pid, user: match[2], started: match[3].replace(/\s+/g, ' '), command: match[4] };
      } catch (error) {
        // The listener may have exited between lsof and ps.
        if (error.code === 1 && !error.stdout?.trim() && !error.stderr?.trim()) return undefined;
        throw error;
      }
    }),
  );
  return processes.filter(Boolean);
}

export function confirmTermination(port) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
      '当前没有交互终端，无法确认终止进程。请在终端重新运行，或用 --port 指定其他端口。',
    );
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const reader = createInterface({ input: process.stdin, output: process.stdout });
    let answered = false;
    function finish(confirmed) {
      if (answered) return;
      answered = true;
      reader.close();
      resolve(confirmed);
    }
    reader.once('SIGINT', () => finish(false));
    reader.once('close', () => finish(false));
    reader.question(`是否终止以上进程并使用端口 ${port} 启动？[Y/n] `, (answer) => {
      const choice = answer.trim();
      finish(choice === '' || /^(?:y|yes|是)$/i.test(choice));
    });
  });
}

const identity = (process) =>
  JSON.stringify([process.pid, process.user, process.started, process.command]);
const printable = (value) => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');

export async function ensureDebugPort(
  port,
  {
    probe = isPortFree,
    list = findPortProcesses,
    confirm = confirmTermination,
    terminate = (pid) => process.kill(pid, 'SIGTERM'),
    pause = wait,
    log = console.log,
  } = {},
) {
  // Port 0 asks the OS to select an unused port.
  if (port === 0) return true;
  for (;;) {
    const processes = await list(port);
    if (!processes.length) {
      if (await probe(port)) return true;
      throw new Error(
        `端口 ${port} 已被占用，但无法识别进程。请自行释放端口，或用 --port 指定其他端口。`,
      );
    }
    log(`端口 ${port} 已被以下进程占用：`);
    for (const item of processes) {
      log(
        `  PID: ${item.pid}  用户: ${printable(item.user)}  启动时间: ${printable(item.started)}\n  命令: ${printable(item.command)}`,
      );
    }
    if (!(await confirm(port))) {
      log('已取消启动，当前占用进程保持运行。');
      return false;
    }
    const confirmed = new Set(processes.map(identity));
    const current = await list(port);
    if (current.some((item) => !confirmed.has(identity(item)))) {
      log('端口占用进程已变化，需要重新确认。');
      continue;
    }
    for (const item of current) {
      try {
        terminate(item.pid);
        log(`已向 PID ${item.pid} 发送终止请求，等待端口释放…`);
      } catch (error) {
        if (error.code !== 'ESRCH') throw new Error(`无法终止 PID ${item.pid}：${error.message}`);
      }
    }
    // Never force-kill or terminate a replacement process without another confirmation.
    for (let attempt = 0; attempt < 25; attempt++) {
      const remaining = await list(port);
      if (!remaining.length && (await probe(port))) return true;
      if (remaining.some((item) => !confirmed.has(identity(item)))) {
        log('有新进程占用端口，需要重新确认。');
        break;
      }
      if (attempt === 24)
        throw new Error(`端口 ${port} 尚未释放。请手动关闭相关程序，或用 --port 指定其他端口。`);
      await pause(200);
    }
  }
}
