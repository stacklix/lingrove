import { afterEach, expect, it, vi } from 'vitest';
import { tts } from '@lingrove/host-sdk';

afterEach(() => {
  delete window.webkit;
});
function bridge(handler: (message: any) => Promise<unknown>) {
  const postMessage = vi.fn(handler);
  window.webkit = { messageHandlers: { lingrove: { postMessage } } };
  return postMessage;
}
it('reports unavailable in browser previews', async () => {
  expect((await tts.status()).configured).toBe(false);
  await expect(tts.synthesize({ text: 'こんにちは' })).rejects.toThrow('请在 Lingrove 中');
});
it('returns a playable data URL and sends only portable synthesis fields', async () => {
  const post = bridge(async () => ({
    audioBase64: 'SUQz',
    mimeType: 'audio/mpeg',
    model: 'speech-test',
    provider: 'minimax',
  }));
  const result = await tts.synthesize({ text: 'こんにちは', speed: 0.8, language: 'ja-JP' });
  expect(result.audioURL).toBe('data:audio/mpeg;base64,SUQz');
  expect(post).toHaveBeenCalledWith({
    version: 1,
    method: 'tts.synthesize',
    params: { id: expect.any(String), text: 'こんにちは', speed: 0.8, language: 'ja-JP' },
  });
});
it('validates text and speed before invoking the host', async () => {
  const post = bridge(async () => ({}));
  for (const text of ['', '  ', 'あ'.repeat(4001)])
    await expect(tts.synthesize({ text })).rejects.toThrow();
  for (const speed of [NaN, Infinity, 0, 2.1])
    await expect(tts.synthesize({ text: 'test', speed })).rejects.toThrow();
  expect(post).not.toHaveBeenCalled();
});
it('cancels the same native request and normalizes cancellation', async () => {
  let rejectRequest!: (error: Error) => void;
  const post = bridge(async (message) => {
    if (message.method === 'tts.cancel') {
      rejectRequest(new Error('cancelled by native'));
      return true;
    }
    return new Promise((_, reject) => {
      rejectRequest = reject;
    });
  });
  const controller = new AbortController();
  const pending = tts.synthesize({ text: 'test' }, { signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(post.mock.calls[1][0].params.id).toBe(post.mock.calls[0][0].params.id);
});
it('does not start pre-cancelled work and removes abort handlers after completion', async () => {
  const post = bridge(async () => ({
    audioBase64: 'SUQz',
    mimeType: 'audio/mpeg',
    model: 'test',
    provider: 'minimax',
  }));
  const cancelled = new AbortController();
  cancelled.abort();
  await expect(
    tts.synthesize({ text: 'test' }, { signal: cancelled.signal }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(post).not.toHaveBeenCalled();
  const completed = new AbortController();
  await tts.synthesize({ text: 'test' }, { signal: completed.signal });
  completed.abort();
  expect(post).toHaveBeenCalledTimes(1);
});

it('streams state before completion and exposes controls for the same native session', async () => {
  let complete!: (result: unknown) => void;
  const post = bridge(async (message) => {
    if (message.method === 'tts.play')
      return new Promise((resolve) => {
        complete = resolve;
      });
    return true;
  });
  const states: string[] = [];
  const playback = tts.play(
    { text: 'こんにちは', language: 'ja' },
    { onState: (state) => states.push(state) },
  );
  expect(post.mock.calls[0][0].params.language).toBe('ja');
  const id = post.mock.calls[0][0].params.id;
  let finished = false;
  void playback.finished.then(() => {
    finished = true;
  });
  window.__lingroveChunk!(id, JSON.stringify({ state: 'playing' }));
  expect(states).toEqual(['playing']);
  expect(finished).toBe(false);
  await playback.pause();
  await playback.resume();
  expect(post.mock.calls.slice(1).map(([m]) => [m.method, m.params.id])).toEqual([
    ['tts.pause', id],
    ['tts.resume', id],
  ]);
  complete({ model: 'test', provider: 'minimax' });
  await playback.finished;
  window.__lingroveChunk!(id, JSON.stringify({ state: 'ended' }));
  expect(states).toEqual(['playing']); // listener disposed after finished
  await playback.stop();
  expect(post).toHaveBeenCalledTimes(3);
});
it('stops playback and turns native cancellation into AbortError', async () => {
  let rejectRequest!: (error: Error) => void;
  bridge(async (message) => {
    if (message.method === 'tts.play')
      return new Promise((_, reject) => {
        rejectRequest = reject;
      });
    rejectRequest(new Error('native cancelled'));
    return true;
  });
  const playback = tts.play({ text: 'test' });
  const rejected = expect(playback.finished).rejects.toMatchObject({ name: 'AbortError' });
  await playback.stop();
  await rejected;
});
it('handles abort before playback without native calls', async () => {
  const post = bridge(async () => true);
  const controller = new AbortController();
  controller.abort();
  await expect(
    tts.play({ text: 'test' }, { signal: controller.signal }).finished,
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(post).not.toHaveBeenCalled();
});
it('propagates stream failure and cleans up state callbacks', async () => {
  let rejectRequest!: (error: Error) => void;
  const post = bridge(
    async () =>
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
  );
  const onState = vi.fn();
  const playback = tts.play({ text: 'test' }, { onState });
  rejectRequest(new Error('truncated stream'));
  await expect(playback.finished).rejects.toThrow('truncated stream');
  window.__lingroveChunk!(post.mock.calls[0][0].params.id, JSON.stringify({ state: 'playing' }));
  expect(onState).not.toHaveBeenCalled();
});

it('rejects invalid language parameters before sending either request', async () => {
  const post = bridge(async () => ({}));
  for (const language of ['', '日语', 'en/US', 'a'.repeat(64), true, 12]) {
    const request = { text: 'test', language } as any;
    await expect(tts.synthesize(request)).rejects.toThrow('朗读语言');
    await expect(tts.play(request).finished).rejects.toThrow('朗读语言');
  }
  expect(post).not.toHaveBeenCalled();
});

it('forwards article voice overrides on both speech request paths', async () => {
  const post = bridge(async () => ({
    audioBase64: 'SUQz',
    mimeType: 'audio/mpeg',
    model: 'test',
    provider: 'minimax',
  }));
  await tts.synthesize({ text: 'test', voice: 'voice-a' });
  await tts.play({ text: 'test', voice: 'voice-b' }, { nextText: 'Next sentence.' }).finished;
  expect(post.mock.calls[0][0].params.voice).toBe('voice-a');
  expect(post.mock.calls[1][0].params.voice).toBe('voice-b');
  expect(post.mock.calls[1][0].params.nextText).toBe('Next sentence.');
});
