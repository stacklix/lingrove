import { mount, flushPromises } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { glyphs } from '../src/curriculum';

const deferred = vi.hoisted(() => {
  let resolve!: (value: { default: Record<string, string> }) => void;
  const promise = new Promise<{ default: Record<string, string> }>((done) => {
    resolve = done;
  });
  return { promise, resolve };
});
vi.mock('../src/pronunciation-audio.json', () => deferred.promise);

import PronunciationButton from '../src/components/PronunciationButton.vue';
import { loadPronunciations, pronunciationFor, stopPronunciation } from '../src/pronunciation';

it('keeps letter metadata available during audio loading and waits for a tap after loading', async () => {
  const play = vi.fn().mockResolvedValue(undefined);
  const createAudio = vi.fn();
  vi.stubGlobal(
    'Audio',
    class {
      pause() {}
      play = play;
      constructor(src: string) {
        createAudio(src);
      }
    },
  );
  const wrapper = mount(PronunciationButton, {
    props: { glyph: glyphs.find((g) => g.id === 'ru-Б')! },
  });
  try {
    expect(pronunciationFor('ru-Б')?.id).toBe('ru-be');
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true');
    const pending = loadPronunciations();
    expect(loadPronunciations()).toBe(pending);
    deferred.resolve({ default: { 'ru-be': 'data:audio/wav;base64,recording' } });
    await pending;
    await flushPromises();
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
    expect(createAudio).not.toHaveBeenCalled();
    await wrapper.get('button').trigger('click');
    expect(createAudio).toHaveBeenCalledWith('data:audio/wav;base64,recording');
    expect(play).toHaveBeenCalledOnce();
  } finally {
    wrapper.unmount();
    stopPronunciation();
    vi.unstubAllGlobals();
  }
});
