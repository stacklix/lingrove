import { beforeEach, expect, it } from 'vitest';
import { moduleStorage } from '@lingrove/host-sdk';
import { emptyProgress, loadProgress, saveProgress } from '../src/progress';
import { glyphs, poolFor } from '../src/curriculum';
import { makeRound } from '../src/session';
import { strokeSteps } from '../src/stroke-order';
beforeEach(() => localStorage.clear());
it('restores unfinished ink and stage without overwriting a different language', async () => {
  const p = emptyProgress();
  p.cursors['ru:mixed'] = {
    id: 'ru-а',
    stage: 'write',
    strokes: [[{ x: 0.2, y: 0.3 }]],
    feedback: null,
  };
  p.cursors['el:mixed'] = { id: 'el-Α', stage: 'observe', strokes: [], feedback: null };
  p.cursors['ja:mixed'] = {
    id: 'ja-ア',
    stage: 'write',
    strokes: [[{ x: 0.4, y: 0.5 }]],
    feedback: null,
  };
  await saveProgress(p);
  expect(await loadProgress()).toEqual(p);
});
it('rejects corrupt cursors and leaves the stored data untouched', async () => {
  const p = emptyProgress();
  p.cursors['ru:mixed'] = {
    id: 'ru-а',
    stage: 'write',
    strokes: [[{ x: Infinity, y: 0 }]],
    feedback: null,
  };
  await moduleStorage('glyphora').set('progress', p);
  await expect(loadProgress()).rejects.toThrow('进度格式异常');
  expect(await moduleStorage('glyphora').get('progress')).not.toBeNull();
});
it('serializes snapshots in save order', async () => {
  const p = emptyProgress();
  const first = saveProgress(p);
  p.learned.push('ru-а');
  const second = saveProgress(p);
  await Promise.all([first, second]);
  expect((await loadProgress()).learned).toEqual(['ru-а']);
});
it('repeats a small learned pool with four distinct choice options', () => {
  const pool = poolFor('ru', 'lower');
  const round = makeRound(pool.slice(0, 1), [], Math.random, pool);
  expect(round).toHaveLength(10);
  expect(round.every((q) => q.glyph.id === pool[0].id)).toBe(true);
  expect(
    round
      .filter((q) => q.type === 'choice')
      .every((q) => q.options.length === 4 && new Set(q.options.map((g) => g.id)).size === 4),
  ).toBe(true);
});
it('has ordered instructions for every supported letter', () => {
  expect(glyphs.every((g) => strokeSteps(g).length > 0)).toBe(true);
});

it('requires current progress fields and cursor keys', async () => {
  const store = moduleStorage('glyphora');
  const missing = { ...emptyProgress() } as any;
  delete missing.lastGroups;
  await store.set('progress', missing);
  await expect(loadProgress()).rejects.toThrow('进度格式异常');
  const p = emptyProgress();
  p.cursors['ja:hiragana'] = { id: 'ja-あ', stage: 'trace', strokes: [], feedback: null };
  await store.set('progress', p);
  await expect(loadProgress()).rejects.toThrow('进度格式异常');
});
