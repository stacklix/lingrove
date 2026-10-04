import { beforeEach, it, expect } from 'vitest';
import { moduleStorage, storage } from '@lingrove/host-sdk';
import { loadHistory, saveHistory } from '../src/persistence';
beforeEach(() => localStorage.clear());
it('keeps Glyphora browser data separate from Sentra', async () => {
  await storage.set('history', { sentra: true });
  await saveHistory({ practices: [], rounds: [] });
  expect(await storage.get('history')).toEqual({ sentra: true });
  expect(await loadHistory()).toEqual({ practices: [], rounds: [] });
});
it('protects unreadable history instead of silently replacing it', async () => {
  const store = moduleStorage('glyphora');
  const original = { practices: [], rounds: [{ answers: null }] };
  await store.set('history', original);
  await expect(loadHistory()).rejects.toThrow('记录格式异常');
  expect(await store.get('history')).toEqual(original);
});
it('bounds saved practice history and rejects impossible scores', async () => {
  const practice = {
    id: 'ru-а',
    score: 80,
    correct: true,
    tracing: false,
    at: new Date().toISOString(),
  };
  await saveHistory({
    practices: Array.from({ length: 510 }, () => ({ ...practice })),
    rounds: [],
  });
  expect((await loadHistory()).practices).toHaveLength(500);
  await moduleStorage('glyphora').set('history', {
    practices: [{ ...practice, score: 200 }],
    rounds: [],
  });
  await expect(loadHistory()).rejects.toThrow();
});
