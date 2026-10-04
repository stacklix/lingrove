import { describe, it, expect } from 'vitest';
import { glyphs, poolFor } from '../src/curriculum';
import { makeRound, summarize } from '../src/session';
import { assess, maskFromAlpha, similarity } from '../src/scoring';
import type { Mask } from '../src/scoring';
describe('curriculum', () => {
  it('contains complete distinct basic alphabets and kana stroke paths', () => {
    expect(new Set(glyphs.map((g) => g.id)).size).toBe(207);
    expect(poolFor('ja', 'hiragana')).toHaveLength(46);
    expect(poolFor('ja', 'katakana')).toHaveLength(46);
    expect(poolFor('ru', 'lower')).toHaveLength(33);
    expect(poolFor('ru', 'upper')).toHaveLength(33);
    expect(poolFor('el', 'lower')).toHaveLength(25);
    expect(poolFor('el', 'upper')).toHaveLength(24);
    expect(
      glyphs
        .filter((g) => g.language === 'ja')
        .every((g) => g.paths?.length && g.paths.every((p) => p.startsWith('M'))),
    ).toBe(true);
  });
});
describe('round generation', () => {
  it('alternates five writing and five choice questions without future answer leaks', () => {
    for (const pool of [poolFor('ja', 'hiragana'), poolFor('ru', 'lower'), poolFor('el', 'upper')])
      for (let run = 0; run < 20; run++) {
        const round = makeRound(pool);
        expect(round).toHaveLength(10);
        expect(new Set(round.map((q) => q.glyph.id)).size).toBe(10);
        round.forEach((q, i) => {
          expect(q.type).toBe(i % 2 ? 'choice' : 'write');
          if (q.type === 'choice') {
            expect(q.options).toHaveLength(4);
            expect(new Set(q.options.map((g) => g.id)).size).toBe(4);
            expect(q.options.filter((g) => g.id === q.glyph.id)).toHaveLength(1);
            expect(q.options.some((g) => round.slice(i + 1).some((f) => f.glyph.id === g.id))).toBe(
              false,
            );
          }
        });
      }
  });
  it('prioritizes errors without duplicating targets or mutating the library', () => {
    const pool = poolFor('ru', 'lower'),
      before = pool.map((g) => g.id);
    const ids = before.slice(5, 8);
    const round = makeRound(pool, ids);
    expect(new Set(round.slice(0, 3).map((q) => q.glyph.id))).toEqual(new Set(ids));
    expect(pool.map((g) => g.id)).toEqual(before);
  });
  it('keeps handwriting and choice results separate', () => {
    expect(
      summarize([
        { id: 'a', text: 'a', type: 'write', score: 80, correct: true, status: 'match' },
        { id: 'b', text: 'b', type: 'choice', score: 0, correct: false, status: 'different' },
      ]),
    ).toEqual({ writing: 80, choices: 0, choiceCount: 1, wrong: ['b'] });
  });
});
function shape(kind: 'L' | 'box' | 'fill', offset = 0): Mask {
  const alpha = new Uint8Array(64 * 64);
  for (let y = 10; y < 50; y++)
    for (let x = 10; x < 40; x++)
      if (kind === 'fill' || x < 13 || y > 46 || (kind === 'box' && (x > 36 || y < 13)))
        alpha[(y + offset) * 64 + x + offset] = 255;
  return maskFromAlpha(alpha, 64, 64);
}
describe('practice scoring', () => {
  it('normalizes positioning and rewards matching reference shapes', () => {
    expect(similarity(shape('L'), shape('L', 4))).toBe(100);
    expect(assess(shape('L'), shape('L'), [{ id: 'box', mask: shape('box') }], 'L')).toMatchObject({
      correct: true,
      status: 'match',
      score: 100,
    });
  });
  it('rejects a different known shape and filled scribbles', () => {
    expect(assess(shape('box'), shape('L'), [{ id: 'box', mask: shape('box') }], 'L').correct).toBe(
      false,
    );
    expect(assess(shape('fill'), shape('L'), [], 'L').correct).toBe(false);
  });
  it('does not report blank or ambiguous handwriting as correct', () => {
    expect(assess({ points: [], ratio: 1, density: 0 }, shape('L'), [], 'L')).toMatchObject({
      score: 0,
      correct: false,
      status: 'uncertain',
    });
    expect(assess(shape('L'), shape('L'), [{ id: 'other', mask: shape('L') }], 'L').status).toBe(
      'uncertain',
    );
  });
});
