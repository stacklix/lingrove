import { afterEach, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { existsSync, readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { createHash } from 'node:crypto';
import { glyphs } from '../src/curriculum';
import samples from '../src/pronunciation-samples.json';
import audioSources from '../src/pronunciation-audio.json';
import sources from '../src/pronunciation-sources.json';
import PronunciationButton from '../src/components/PronunciationButton.vue';
import {
  playPronunciation,
  stopPronunciation,
  speaking,
  playbackError,
  pronunciationFor,
} from '../src/pronunciation';

afterEach(() => {
  stopPronunciation();
  vi.unstubAllGlobals();
  playbackError.value = '';
});
it('bundles each sample and shares pronunciation between both written forms', () => {
  for (const sample of samples) {
    expect(existsSync(new NodeURL(`../audio-generated/${sample.id}.wav`, import.meta.url))).toBe(true);
    const bytes = readFileSync(new NodeURL(`../audio-generated/${sample.id}.wav`, import.meta.url));
    expect(audioSources[sample.id as keyof typeof audioSources]).toBe(`data:audio/wav;base64,${bytes.toString('base64')}`);
    for (const id of sample.glyphs) {
      expect(glyphs.some((g) => g.id === id)).toBe(true);
      expect(pronunciationFor(id)).toBe(sample);
    }
  }
  expect(samples).toHaveLength(103);
  expect(glyphs).toHaveLength(207);
  for (const glyph of glyphs) {
    expect(samples.filter((sample) => sample.glyphs.includes(glyph.id))).toHaveLength(1);
  }
  expect(pronunciationFor('el-ς')).toBe(pronunciationFor('el-σ'));
  expect(pronunciationFor('missing')).toBeUndefined();
  for (const sample of samples) {
    expect(sample.recording).toBeTruthy();
    expect('voice' in sample).toBe(false);
    const source = sources.find((source) => source.id === sample.id)!;
    expect(source.license).toBeTruthy();
    const recording = readFileSync(new NodeURL(`../audio-sources/${sample.recording}`, import.meta.url));
    expect(createHash('sha256').update(recording).digest('hex')).toBe(source.downloadSha256);
  }
});
it('stops previous audio and ignores an outdated playback failure', async () => {
  const players: any[] = [];
  vi.stubGlobal(
    'Audio',
    class {
      onended = null;
      onerror = null;
      pause = vi.fn();
      play = vi.fn(
        () =>
          new Promise<void>((_, reject) => {
            this.reject = reject;
          }),
      );
      reject!: (error: Error) => void;
      constructor(public src: string) {
        players.push(this);
      }
    },
  );
  const first = playPronunciation('ja-し');
  const second = playPronunciation('ru-Б');
  expect(players[0].pause).toHaveBeenCalledOnce();
  expect(players[1].src).toMatch(/^data:audio\/wav;base64,/);
  players[0].reject(new Error('cancelled'));
  await first;
  expect(speaking.value).toBe('ru-be');
  expect(playbackError.value).toBe('');
  players[1].reject(new Error('missing file'));
  await second;
  expect(playbackError.value).toBe('ru-be');
  expect(speaking.value).toBe('');
});
it('provides playback failure feedback and permits retry', async () => {
  let fail = true;
  vi.stubGlobal(
    'Audio',
    class {
      pause() {}
      play() {
        return fail ? Promise.reject(new Error('blocked')) : Promise.resolve();
      }
    },
  );
  const wrapper = mount(PronunciationButton, {
    props: { glyph: glyphs.find((g) => g.id === 'el-β')! },
  });
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(wrapper.text()).toBe('');
  expect(wrapper.get('button').attributes('aria-label')).toContain('播放失败，重试');
  expect(wrapper.get('button').classes()).toContain('failed');
  fail = false;
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(wrapper.text()).toBe('');
  expect(wrapper.get('button').attributes('aria-label')).toContain('正在播放');
  expect(wrapper.get('button').classes()).toContain('playing');
  expect(wrapper.get('button').classes()).not.toContain('failed');
  wrapper.unmount();
  expect(speaking.value).toBe('');
});
