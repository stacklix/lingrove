import { beforeEach, it, expect } from 'vitest';
import { moduleStorage } from '@lingrove/host-sdk';
const storage = moduleStorage('sentra');
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

it('round-trips current answers and rejects missing group, ink or choice data', async () => {
  const store = moduleStorage('glyphora');
  const data = {
    practices: [],
    rounds: [
      {
        id: 'round',
        language: '俄语',
        group: 'mixed' as const,
        at: new Date().toISOString(),
        answers: Array.from({ length: 10 }, (_, i) => ({
          id: 'ru-а',
          text: 'а',
          score: 100,
          correct: true,
          status: 'match',
          ...(i % 2
            ? { type: 'choice' as const, chosenID: 'ru-а' }
            : { type: 'write' as const, strokes: [[{ x: 0.2, y: 0.3 }]] }),
        })),
      },
    ],
  };
  await saveHistory(data);
  expect(await loadHistory()).toEqual(data);
  for (const field of ['group', 'strokes', 'chosenID']) {
    const invalid = JSON.parse(JSON.stringify(data));
    if (field === 'group') delete invalid.rounds[0].group;
    else delete invalid.rounds[0].answers[field === 'strokes' ? 0 : 1][field];
    await store.set('history', invalid);
    await expect(loadHistory()).rejects.toThrow('记录格式异常');
  }
});
