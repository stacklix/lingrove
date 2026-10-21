import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_DEBUG_PORT, ensureDebugPort } from '../debug-port.mjs';

const listener = {
  pid: 123,
  user: 'developer',
  started: 'Wed Oct 21 10:00:00 2026',
  command: 'node previous-server.mjs',
};
function fixture(options = {}) {
  const state = { free: false, killed: [], prompts: 0, output: [] };
  return {
    state,
    options: {
      probe: async () => state.free,
      list: async () => (state.free ? [] : [listener]),
      confirm: async () => {
        state.prompts++;
        return true;
      },
      terminate: (pid) => {
        state.killed.push(pid);
        state.free = true;
      },
      pause: async () => {},
      log: (line) => state.output.push(line),
      ...options,
    },
  };
}

test('defaults to port 8000 and skips confirmation when the port is free or automatically assigned', async () => {
  assert.equal(DEFAULT_DEBUG_PORT, 8000);
  const { state, options } = fixture();
  state.free = true;
  assert.equal(await ensureDebugPort(8000, options), true);
  state.free = false;
  assert.equal(await ensureDebugPort(0, options), true);
  assert.equal(state.prompts, 0);
  assert.deepEqual(state.killed, []);
});

test('shows process details and leaves listeners untouched when confirmation is declined', async () => {
  const { state, options } = fixture({ confirm: async () => false });
  assert.equal(await ensureDebugPort(8000, options), false);
  const output = state.output.join('\n');
  for (const text of [
    '8000',
    String(listener.pid),
    listener.user,
    listener.started,
    listener.command,
  ])
    assert.ok(output.includes(text), text);
  assert.deepEqual(state.killed, []);
});

test('terminates only after confirmation, handles multiple listeners, and waits until the port is free', async () => {
  const second = { ...listener, pid: 124, command: 'node second-server.mjs' };
  let confirmed = false;
  const killed = [];
  const { options } = fixture({
    probe: async () => killed.length === 2,
    list: async () => [listener, second].filter((item) => !killed.includes(item.pid)),
    confirm: async () => {
      confirmed = true;
      return true;
    },
    terminate: (pid) => {
      assert.equal(confirmed, true);
      killed.push(pid);
    },
  });
  assert.equal(await ensureDebugPort(8000, options), true);
  assert.deepEqual(killed, [123, 124]);
});

for (const replacement of [
  { ...listener, pid: 456 },
  { ...listener, started: 'Wed Oct 21 11:00:00 2026' },
  { ...listener, command: 'node different-server.mjs' },
])
  test(`requires new confirmation if the displayed process changes: ${JSON.stringify(replacement)}`, async () => {
    let reads = 0;
    let prompts = 0;
    const { state, options } = fixture({
      list: async () => [++reads === 1 ? listener : replacement],
      confirm: async () => ++prompts === 1,
    });
    assert.equal(await ensureDebugPort(8000, options), false);
    assert.equal(prompts, 2);
    assert.deepEqual(state.killed, []);
  });

test('does not terminate a new listener that appears after the approved process exits', async () => {
  let terminated = false;
  let prompts = 0;
  const replacement = { ...listener, pid: 456 };
  const { options } = fixture({
    probe: async () => false,
    list: async () => [terminated ? replacement : listener],
    confirm: async () => ++prompts === 1,
    terminate: (pid) => {
      assert.equal(pid, listener.pid);
      terminated = true;
    },
  });
  assert.equal(await ensureDebugPort(8000, options), false);
  assert.equal(prompts, 2);
});

test('continues without terminating anything if the listener exits while awaiting confirmation', async () => {
  let confirmed = false;
  const { state, options } = fixture({
    probe: async () => confirmed,
    list: async () => (confirmed ? [] : [listener]),
    confirm: async () => {
      confirmed = true;
      return true;
    },
  });
  assert.equal(await ensureDebugPort(8000, options), true);
  assert.deepEqual(state.killed, []);
});

test('reports a process that refuses to exit without escalating to a force kill', async () => {
  const killed = [];
  const { options } = fixture({ terminate: (pid) => killed.push(pid) });
  await assert.rejects(ensureDebugPort(8000, options), /尚未释放/);
  assert.deepEqual(killed, [listener.pid]);
});

test('does not request permission or terminate when the occupied port has no identifiable listener', async () => {
  const { state, options } = fixture({ list: async () => [] });
  await assert.rejects(ensureDebugPort(8000, options), /无法识别进程/);
  assert.equal(state.prompts, 0);
  assert.deepEqual(state.killed, []);
});

test('checks listeners even when the OS permits another bind on a different interface', async () => {
  const { state, options } = fixture({ probe: async () => true, confirm: async () => false });
  assert.equal(await ensureDebugPort(8000, options), false);
  assert.deepEqual(state.killed, []);
  assert.ok(state.output.join('\n').includes(listener.command));
});

test('reports insufficient permission to terminate the confirmed process', async () => {
  const { options } = fixture({
    terminate: () => {
      throw Object.assign(new Error('Operation not permitted'), { code: 'EPERM' });
    },
  });
  await assert.rejects(ensureDebugPort(8000, options), /无法终止 PID 123.*Operation not permitted/);
});
