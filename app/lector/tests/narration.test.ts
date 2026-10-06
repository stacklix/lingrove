import { describe, it, expect, vi } from 'vitest';
import { useNarration } from '../src/narration';
import { tts, type TTSPlaybackState } from '@lingrove/host-sdk';
function setup(texts = ['第一句。', '第二句。', '第三句。']) {
  const calls: {
    resolve: () => void;
    reject: (e: Error) => void;
    stop: ReturnType<typeof vi.fn>;
    emit: (state: TTSPlaybackState) => void;
  }[] = [];
  const play = vi.fn((_input, options) => {
    let resolve!: () => void, reject!: (e: Error) => void;
    const finished = new Promise<any>((yes, no) => {
      resolve = () => yes({});
      reject = no;
    });
    const stop = vi.fn().mockResolvedValue(undefined);
    calls.push({ resolve, reject, stop, emit: options.onState });
    return {
      finished,
      stop,
      pause: vi.fn(async () => options.onState('paused')),
      resume: vi.fn(async () => options.onState('playing')),
    };
  });
  return {
    narration: useNarration(
      () => texts,
      () => 'zh-CN',
      { ...tts, play },
    ),
    calls,
    play,
  };
}
describe('article narration seeking', () => {
  it('jumps to an ungenerated sentence and ignores stale completion and states', async () => {
    const { narration: n, calls, play } = setup();
    const first = n.seek(0);
    expect(play.mock.calls[0][1].nextText).toBe('第二句。');
    expect(n.speakingSentence.value).toBeNull();
    calls[0].emit('playing');
    expect(n.speakingSentence.value).toBe(0);
    const second = n.seek(50);
    expect(n.speakingSentence.value).toBeNull();
    expect(calls[0].stop).toHaveBeenCalledOnce();
    expect(play.mock.calls[1][0]).toEqual({ text: '第二句。', language: 'zh-CN' });
    calls[0].emit('ended');
    calls[0].emit('playing');
    expect(n.speakingSentence.value).toBeNull();
    calls[0].resolve();
    await first;
    expect(play).toHaveBeenCalledTimes(2);
    expect(n.state.value).toBe('buffering');
    calls[1].emit('playing');
    expect(n.speakingSentence.value).toBe(1);
    calls[1].emit('ended');
    expect(n.state.value).toBe('playing');
    calls[1].resolve();
    await Promise.resolve();
    expect(play.mock.calls[2][0].text).toBe('第三句。');
    expect(play.mock.calls[2][1].nextText).toBeUndefined();
    calls[2].emit('playing');
    expect(n.speakingSentence.value).toBe(2);
    calls[2].resolve();
    await second;
    expect(n.position.value).toBe(100);
    expect(n.speakingSentence.value).toBeNull();
  });
  it('pauses, resumes, and stops without playing the next sentence', async () => {
    const { narration: n, calls, play } = setup();
    const run = n.seek(0);
    await n.toggle();
    expect(n.state.value).toBe('paused');
    await n.toggle();
    expect(n.state.value).toBe('playing');
    n.stop();
    expect(n.speakingSentence.value).toBeNull();
    calls[0].resolve();
    await run;
    expect(play).toHaveBeenCalledOnce();
    expect(n.state.value).toBe('idle');
  });
  it('reports provider failure and bounds long Unicode requests', async () => {
    const { narration: n, calls, play } = setup(['😀'.repeat(3000)]);
    const run = n.seek(0);
    expect(play.mock.calls[0][0].text.length).toBeLessThanOrEqual(4000);
    calls[0].reject(new Error('provider failed'));
    await run;
    expect(n.error.value).toBe('provider failed');
    expect(n.state.value).toBe('idle');
  });
});

it('seeks to a sentence exactly and keeps pause active between chunks', async () => {
  const { narration: n, calls, play } = setup(['One.', ' A longer second sentence.', 'Three.']);
  const run = n.seekSentence(1);
  expect(play.mock.calls[0][0].text).toBe(' A longer second sentence.');
  expect(n.requestedSentence.value).toBe(1);
  await n.pause();
  calls[0].resolve();
  await Promise.resolve();
  await Promise.resolve();
  expect(play).toHaveBeenCalledTimes(1);
  expect(n.state.value).toBe('paused');
  await n.resume();
  expect(play.mock.calls[1][0].text).toBe('Three.');
  calls[1].resolve();
  await run;
  expect(n.state.value).toBe('ended');
});
it('stopping while paused between chunks prevents any later playback', async () => {
  const { narration: n, calls, play } = setup();
  const run = n.seek(0);
  await n.pause();
  calls[0].resolve();
  await Promise.resolve();
  n.stop();
  await run;
  await n.resume();
  expect(play).toHaveBeenCalledTimes(1);
  expect(n.state.value).toBe('idle');
});
