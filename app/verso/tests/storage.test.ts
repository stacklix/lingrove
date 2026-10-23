import { beforeEach, expect, it, vi } from 'vitest';
import { demo, demoSource } from '../src/demo';
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock('@lingrove/host-sdk', () => ({ moduleStorage: () => mocks }));
import { loadState } from '../src/storage';
import { translationKey } from '../src/sentence-translations';
beforeEach(() => vi.clearAllMocks());
it('migrates old books and keeps draft text without injecting defaults', async () => {
  mocks.get.mockResolvedValue({
    draft: demoSource,
    ruby: true,
    library: [{ id: 'old', source: demoSource, createdAt: 1, reading: demo, sentence: 0 }],
  });
  const state = await loadState();
  expect(state.library).toHaveLength(1);
  expect(state.draft).toBe(demoSource);
  expect(state.draftTitle).toBe('');
  expect(state.jobs).toEqual([]);
});
it('restores interrupted tasks as paused, preserves source/progress, and avoids duplicate completed articles', async () => {
  const job = {
    id: 'pending',
    source: demoSource,
    title: '草稿文章',
    origin: '文本导入',
    createdAt: 1,
    status: 'running',
    done: 1,
    total: 3,
    error: '',
  };
  mocks.get.mockResolvedValue({
    draft: '',
    draftTitle: '新草稿',
    jobs: [job, { ...job, id: 'ready' }],
    library: [{ id: 'ready', source: demoSource, createdAt: 1, reading: demo, sentence: 0 }],
  });
  const state = await loadState();
  expect(state.jobs).toHaveLength(1);
  expect(state.jobs[0]).toMatchObject({ status: 'paused', source: demoSource, done: 1, total: 3 });
  expect(state.jobs[0].error).toContain('中断');
  expect(state.draftTitle).toBe('新草稿');
});
it('restores translation settings and validated caches while retaining article learning records', async () => {
  const key = translationKey(demoSource, 'ja', 'zh-Hans');
  const translation = {
    source: demoSource,
    sourceLanguage: 'ja',
    language: 'zh-Hans',
    translation: '我昨天在图书馆读了书。',
  };
  const stats = { opens: 4, seconds: 125, lookups: 2, visited: [0], lastRead: 123 };
  mocks.get.mockResolvedValue({
    draftTranslate: true,
    jobs: [
      {
        id: 'pending',
        language: 'ja',
        source: demoSource,
        translationLanguage: 'zh-Hans',
        translations: { [key]: translation },
        status: 'running',
        done: 1,
        total: 1,
      },
    ],
    library: [
      {
        id: 'book',
        source: demoSource,
        createdAt: 1,
        reading: demo,
        sentence: 0,
        stats,
        translations: { [key]: translation, corrupt: { ...translation, translation: '' } },
      },
    ],
  });
  const state = await loadState();
  expect(state.draftTranslate).toBe(true);
  expect(state.jobs[0]).toMatchObject({
    status: 'paused',
    translationLanguage: 'zh-Hans',
    translations: { [key]: translation },
  });
  expect(state.library[0].translations).toEqual({ [key]: translation });
  expect(state.library[0].source).toBe(demoSource);
  expect(state.library[0].stats).toEqual(stats);
});

it('restores valid generation choices and rejects invalid saved options without losing books', async () => {
  const preferences = {
    language: 'en',
    level: 'B2',
    topic: 'travel',
    customTopic: '',
    length: 700,
  };
  const book = { id: 'book', source: demoSource, createdAt: 1, reading: demo, sentence: 0 };
  mocks.get.mockResolvedValue({ library: [book], generationPreferences: preferences });
  expect((await loadState()).generationPreferences).toEqual(preferences);
  for (const patch of [{ level: 'N1' }, { length: -1 }, { topic: 'unknown' }]) {
    mocks.get.mockResolvedValue({
      library: [book],
      generationPreferences: { ...preferences, ...patch },
    });
    const restored = await loadState();
    expect(restored.generationPreferences).toEqual({
      language: 'ja',
      level: 'N5',
      topic: 'daily-life',
      customTopic: '',
      length: 300,
    });
    expect(restored.library[0].source).toBe(demoSource);
  }
});
