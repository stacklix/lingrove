import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demo } from '../src/demo';
import type { Reading } from '../src/model';
import {
  prefetchTranslations,
  readTranslationCache,
  translationKey,
  type TranslationCache,
} from '../src/sentence-translations';

const mocks = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock('@lingrove/host-sdk', () => ({ llm: { complete: mocks.complete } }));
const signal = () => new AbortController().signal;
const key = (source: string, language = 'zh-Hans') => translationKey(source, 'en', language);
const reading = (source: string): Reading => ({
  language: 'en',
  sentences: [
    {
      tokens: [{ ...demo.sentences[0].tokens[0], kind: 'separator', text: source, ruby: [] }],
      translation: '',
      explanation: '',
    },
  ],
});
const response = (request: { messages: { content: string }[] }) => ({
  text: JSON.stringify({
    translations: JSON.parse(request.messages[0].content)
      .sentences.map(({ id, source }: { id: number; source: string }) => ({
        id,
        translation: `译文：${source}`,
      }))
      .reverse(),
  }),
});
beforeEach(() => {
  mocks.complete.mockReset().mockImplementation(async (request) => response(request));
});

describe('sentence translation prefetch', () => {
  it('uses the reader sentence boundaries and maps responses by id, preserving whitespace and context', async () => {
    const progress = vi.fn();
    const checkpoint = vi.fn();
    const source = 'One. \nTwo! Three?';
    const cache = await prefetchTranslations(
      reading(source),
      'zh-Hans',
      signal(),
      {},
      checkpoint,
      progress,
    );
    const input = JSON.parse(mocks.complete.mock.calls[0][0].messages[0].content);
    expect(input).toEqual({
      sourceLanguage: 'en',
      targetLanguage: 'zh-Hans',
      sentences: [
        { id: 0, source: 'One. \n', before: '', after: 'Two! ' },
        { id: 1, source: 'Two! ', before: 'One. \n', after: 'Three?' },
        { id: 2, source: 'Three?', before: 'Two! ', after: '' },
      ],
    });
    expect(cache[key('One. \n')].translation).toBe('译文：One.');
    expect(cache[key('Two! ')].translation).toBe('译文：Two!');
    expect(cache[key('Three?')].translation).toBe('译文：Three?');
    expect(checkpoint).toHaveBeenCalledOnce();
    expect(progress).toHaveBeenLastCalledWith({ done: 3, total: 3, requestStatus: undefined });
  });

  it('checkpoints completed batches and resumes after a later request fails', async () => {
    const sentences = Array.from({ length: 10 }, (_, i) => `Sentence ${i}. `);
    const book = reading(sentences.join(''));
    let saved: TranslationCache = {};
    const checkpoint = vi.fn(async (cache: TranslationCache) => {
      saved = cache;
    });
    mocks.complete
      .mockImplementationOnce(async (request) => response(request))
      .mockRejectedValueOnce(new Error('network'));
    await expect(prefetchTranslations(book, 'zh-Hans', signal(), {}, checkpoint)).rejects.toThrow(
      'network',
    );
    expect(Object.keys(saved)).toHaveLength(8);
    const cache = await prefetchTranslations(book, 'zh-Hans', signal(), saved, checkpoint);
    const lastInput = JSON.parse(mocks.complete.mock.calls.at(-1)![0].messages[0].content);
    expect(lastInput.sentences.map((s: { source: string }) => s.source)).toEqual(
      sentences.slice(8),
    );
    expect(Object.keys(cache)).toHaveLength(10);
    expect(Object.keys(checkpoint.mock.calls[0][0])).toHaveLength(8);
  });

  it('deduplicates repeated sentences while counting each occurrence and isolates source and target languages', async () => {
    const book = reading('Same. Same. ');
    const entry = {
      source: 'Same. ',
      sourceLanguage: 'en' as const,
      language: 'zh-Hans',
      translation: '相同。',
    };
    const existing = { [key(entry.source)]: entry };
    const progress = vi.fn();
    await prefetchTranslations(book, 'zh-Hans', signal(), existing, undefined, progress);
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(progress).toHaveBeenLastCalledWith({ done: 2, total: 2, requestStatus: undefined });
    const translated = await prefetchTranslations(book, 'ja', signal(), existing);
    expect(JSON.parse(mocks.complete.mock.calls[0][0].messages[0].content).sentences).toHaveLength(
      1,
    );
    expect(translated[key(entry.source)]).toEqual(entry);
    expect(translated[key(entry.source, 'ja')].language).toBe('ja');
    await prefetchTranslations({ ...book, language: 'ru' }, 'zh-Hans', signal(), existing);
    expect(mocks.complete).toHaveBeenCalledTimes(2);
  });

  it.each([
    '{}',
    '{"translations":[{"id":0,"translation":"第一句"}]}',
    '{"translations":[{"id":0,"translation":"第一句"},{"id":0,"translation":"重复"}]}',
    '{"translations":[{"id":0,"translation":"第一句"},{"id":2,"translation":"越界"}]}',
    '{"translations":[{"id":0,"translation":"第一句"},{"id":1,"translation":"  "}]}',
    '{"translations":[{"id":"0","translation":"第一句"},{"id":1,"translation":"第二句"}]}',
  ])('does not cache any part of an invalid batch: %s', async (text) => {
    mocks.complete.mockResolvedValue({ text });
    const checkpoint = vi.fn();
    await expect(
      prefetchTranslations(reading('One. Two.'), 'zh-Hans', signal(), {}, checkpoint),
    ).rejects.toThrow('句子翻译不完整');
    expect(checkpoint).not.toHaveBeenCalled();
  });

  it('does not request after cancellation or cache a late result', async () => {
    const cancelled = new AbortController();
    cancelled.abort();
    await expect(
      prefetchTranslations(reading('One.'), 'zh-Hans', cancelled.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.complete).not.toHaveBeenCalled();
    const late = new AbortController();
    mocks.complete.mockImplementation(async (request) => {
      late.abort();
      return response(request);
    });
    const checkpoint = vi.fn();
    await expect(
      prefetchTranslations(reading('One.'), 'zh-Hans', late.signal, {}, checkpoint),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(checkpoint).not.toHaveBeenCalled();
  });

  it('drops invalid or unrelated cached translations without changing valid entries', () => {
    const valid = {
      source: 'One.',
      sourceLanguage: 'en',
      language: 'zh-Hans',
      translation: '一句。',
    };
    const cache = readTranslationCache(
      {
        valid,
        blank: { ...valid, translation: '' },
        unrelated: { ...valid, source: 'Other.' },
        language: { ...valid, language: 'unknown' },
      },
      'One. Two.',
    );
    expect(cache).toEqual({ [key('One.')]: valid });
  });
});
