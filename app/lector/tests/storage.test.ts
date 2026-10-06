import { beforeEach, expect, it, vi } from 'vitest';
import { demo, demoSource } from '../src/demo';
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock('@lingrove/host-sdk', () => ({ moduleStorage: () => mocks }));
import { loadState } from '../src/storage';
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
