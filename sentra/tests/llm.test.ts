import { beforeEach, expect, it, vi } from 'vitest';
import { llm } from '@lingrove/host-sdk';

beforeEach(() => {
  delete window.webkit;
  vi.unstubAllGlobals();
});
function bridge(handler: (message: any) => Promise<unknown>) {
  const postMessage = vi.fn(handler);
  window.webkit = { messageHandlers: { lingrove: { postMessage } } };
  return postMessage;
}
const input = { messages: [{ role: 'user' as const, content: 'hello' }] };
const response = {
  status: 200,
  headers: { 'content-type': 'text/event-stream' },
  body: '',
  model: 'shared-model',
  protocol: 'openAi',
};
it('uses the host-selected model, sends no URL, headers or credentials', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const post = bridge(async ({ method, params }) => {
    if (method === 'llm.status') return { configured: true, model: 'shared-model' };
    window.__lingroveChunk?.(
      params.id,
      'data: {"choices":[{"delta":{"content":"你好"}}]}\n\ndata: [DONE]\n\n',
    );
    return response;
  });
  expect(await llm.status()).toEqual({ configured: true, model: 'shared-model' });
  expect(await llm.complete(input)).toEqual({ text: '你好', model: 'shared-model' });
  expect(post.mock.calls[1][0].params).toEqual({
    id: expect.any(String),
    messages: input.messages,
    system: '',
    maxTokens: 4096,
  });
  expect(fetch).not.toHaveBeenCalled();
});
it('normalizes Anthropic streams split across chunks', async () => {
  bridge(async ({ params }) => {
    for (const char of 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\r\n\r\ndata: {"type":"message_stop"}\n\n')
      window.__lingroveChunk?.(params.id, char);
    return { ...response, protocol: 'anthropic' };
  });
  expect((await llm.complete(input)).text).toBe('Hello');
});
it('rejects truncation and cancels the native stream', async () => {
  const post = bridge(async ({ method, params }) => {
    if (method === 'llm.cancel') return true;
    window.__lingroveChunk?.(params.id, 'data: {"choices":[{"finish_reason":"length"}]}\n\n');
    return response;
  });
  await expect(llm.complete(input)).rejects.toThrow('截断');
  expect(post.mock.calls.some(([m]) => m.method === 'llm.cancel')).toBe(true);
});
it('propagates abort and removes stream callbacks', async () => {
  let resolve!: (value: unknown) => void;
  const post = bridge(async ({ method }) =>
    method === 'llm.cancel'
      ? true
      : new Promise((r) => {
          resolve = r;
        }),
  );
  const controller = new AbortController();
  const progress = vi.fn();
  const pending = llm.complete(input, { signal: controller.signal, onProgress: progress });
  controller.abort();
  resolve(response);
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(post.mock.calls.some(([m]) => m.method === 'llm.cancel')).toBe(true);
  window.__lingroveChunk?.(
    post.mock.calls[0][0].params.id,
    'data: {"choices":[{"delta":{"content":"late"}}]}\n\n',
  );
  expect(progress).not.toHaveBeenCalled();
});
it('keeps concurrent requests independent', async () => {
  const pending: { id: string; resolve: (value: unknown) => void }[] = [];
  bridge(async ({ params }) => new Promise((resolve) => pending.push({ id: params.id, resolve })));
  const first = llm.complete(input),
    second = llm.complete(input);
  for (const [index, p] of pending.entries()) {
    window.__lingroveChunk?.(
      p.id,
      `data: ${JSON.stringify({ choices: [{ delta: { content: String(index) } }] })}\n\ndata: [DONE]\n\n`,
    );
    p.resolve(response);
  }
  expect((await first).text).toBe('0');
  expect((await second).text).toBe('1');
});
it('does not expose server error bodies and does not fetch in browser preview', async () => {
  bridge(async () => ({ ...response, status: 401, body: 'private upstream details' }));
  await expect(llm.complete(input)).rejects.toThrow('HTTP 401');
  delete window.webkit;
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await expect(llm.complete(input)).rejects.toThrow('宿主');
  expect(fetch).not.toHaveBeenCalled();
});
