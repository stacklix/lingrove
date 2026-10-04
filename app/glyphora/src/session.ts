import type { Glyph } from './curriculum';
export interface Question {
  glyph: Glyph;
  type: 'write' | 'choice';
  options: Glyph[];
}
export interface Answer {
  id: string;
  type: 'write' | 'choice';
  score: number;
  correct: boolean;
  status: string;
  text: string;
  strokes?: import('./scoring').Strokes;
  chosenID?: string;
}
export function shuffle<T>(values: T[], random = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function makeRound(
  pool: Glyph[],
  reviewIDs: string[] = [],
  random = Math.random,
  distractorPool: Glyph[] = pool,
): Question[] {
  if (!pool.length) throw new Error('请先学习字母，或选择全部字母测试');
  if (distractorPool.length < 4) throw new Error('至少需要四个字形作为选项');
  const review = shuffle(
    pool.filter((g) => reviewIDs.includes(g.id)),
    random,
  );
  const rest = shuffle(
    pool.filter((g) => !reviewIDs.includes(g.id)),
    random,
  );
  const ordered = [...review, ...rest];
  const targets = Array.from({ length: 10 }, (_, i) => ordered[i % ordered.length]);
  return targets.map((glyph, i) => {
    // Future targets must not appear as distractors and leak later answers.
    const future = new Set(targets.slice(i + 1).map((g) => g.id));
    const candidates = distractorPool.filter((g) => g.id !== glyph.id && !future.has(g.id));
    return {
      glyph,
      type: i % 2 === 0 ? 'write' : 'choice',
      options:
        i % 2 === 0 ? [] : shuffle([glyph, ...shuffle(candidates, random).slice(0, 3)], random),
    };
  });
}
export function summarize(answers: Answer[]) {
  const writing = answers.filter((a) => a.type === 'write');
  const choices = answers.filter((a) => a.type === 'choice');
  return {
    writing: writing.length
      ? Math.round(writing.reduce((n, a) => n + a.score, 0) / writing.length)
      : 0,
    choices: choices.filter((a) => a.correct).length,
    choiceCount: choices.length,
    wrong: answers.filter((a) => !a.correct).map((a) => a.id),
  };
}
