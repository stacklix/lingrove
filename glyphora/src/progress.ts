import { moduleStorage } from '@lingrove/host-sdk';
import { glyphs, groups, type Language, type Group } from './curriculum';
import type { Strokes, Assessment } from './scoring';
import type { Answer, Question } from './session';
export type Tab = 'study' | 'tests' | 'letters';
export type Stage = 'observe' | 'trace' | 'write';
export interface StudyCursor {
  id: string;
  stage: Stage;
  strokes: Strokes;
  drawing?: string;
  feedback: Assessment | null;
}
export interface DraftRound {
  id: string;
  group: Group;
  questions: Question[];
  answers: Answer[];
  index: number;
  strokes: Strokes;
  drawing?: string;
  feedback: Assessment | null;
  selected: string | null;
}
export interface Progress {
  version: 1;
  lastGroups: Partial<Record<Language, Group>>;
  language: Language;
  tab: Tab;
  learned: string[];
  cursors: Record<string, StudyCursor>;
  drafts: Partial<Record<Language, DraftRound>>;
}
export const emptyProgress = (): Progress => ({
  version: 1,
  lastGroups: {},
  language: 'ru',
  tab: 'study',
  learned: [],
  cursors: {},
  drafts: {},
});
const store = moduleStorage('glyphora');
const known = new Map(glyphs.map((g) => [g.id, g]));
function validInk(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length <= 128 &&
    value.every(
      (s) =>
        Array.isArray(s) &&
        s.length <= 2048 &&
        s.every(
          (p) =>
            p &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            p.x >= 0 &&
            p.x <= 1 &&
            p.y >= 0 &&
            p.y <= 1,
        ),
    )
  );
}
function validFeedback(v: any): boolean {
  return (
    v === null ||
    (v &&
      Number.isFinite(v.score) &&
      v.score >= 0 &&
      v.score <= 100 &&
      typeof v.correct === 'boolean' &&
      ['match', 'different', 'uncertain'].includes(v.status) &&
      typeof v.feedback === 'string')
  );
}
function validDrawing(v: any): boolean {
  return v === undefined || (typeof v === 'string' && v.length < 2_000_000);
}
export async function loadProgress(): Promise<Progress> {
  const p = await store.get<Progress>('progress-v1');
  if (!p) return emptyProgress();
  p.lastGroups ??= {};
  const invalid = () => {
    throw new Error('学习进度格式异常，原始记录已保留。');
  };
  if (
    p.version !== 1 ||
    !['ja', 'ru', 'el'].includes(p.language) ||
    !['study', 'tests', 'letters'].includes(p.tab) ||
    !Array.isArray(p.learned) ||
    !p.learned.every((id) => known.has(id)) ||
    !p.cursors ||
    !p.drafts
  )
    return invalid();
  for (const [lang, group] of Object.entries(p.lastGroups))
    if (!['ja', 'ru', 'el'].includes(lang) || !groups(lang as Language).some((g) => g.id === group))
      return invalid();
  for (const [key, c] of Object.entries(p.cursors)) {
    const g = known.get(c?.id);
    if (
      !g ||
      (!(g.language === 'ja' && key === 'ja:mixed') &&
        !groups(g.language).some(
          (group) =>
            key === `${g.language}:${group.id}` && (group.id === 'mixed' || group.id === g.group),
        )) ||
      !['observe', 'trace', 'write'].includes(c.stage) ||
      !validInk(c.strokes) ||
      !validDrawing(c.drawing) ||
      !validFeedback(c.feedback)
    )
      return invalid();
  }
  for (const [lang, d] of Object.entries(p.drafts)) {
    if (
      !['ja', 'ru', 'el'].includes(lang) ||
      !d ||
      typeof d.id !== 'string' ||
      !groups(lang as Language).some((g) => g.id === d.group) ||
      !Array.isArray(d.questions) ||
      d.questions.length !== 10 ||
      !Number.isInteger(d.index) ||
      d.index < 0 ||
      d.index > 9 ||
      !Array.isArray(d.answers) ||
      d.answers.length !== d.index ||
      !validInk(d.strokes) ||
      !validDrawing(d.drawing) ||
      !validFeedback(d.feedback)
    )
      return invalid();
    if (
      !d.questions.every(
        (q, i) =>
          known.get(q.glyph?.id)?.language === lang &&
          (d.group === 'mixed' || known.get(q.glyph.id)?.group === d.group) &&
          q.type === (i % 2 ? 'choice' : 'write') &&
          Array.isArray(q.options) &&
          (q.type === 'write'
            ? q.options.length === 0
            : q.options.length === 4 &&
              new Set(q.options.map((g) => g.id)).size === 4 &&
              q.options.some((g) => g.id === q.glyph.id)) &&
          q.options.every((g) => known.get(g.id)?.language === lang),
      )
    )
      return invalid();
    if (
      !d.answers.every(
        (a, i) =>
          a.id === d.questions[i].glyph.id &&
          a.type === d.questions[i].type &&
          Number.isFinite(a.score) &&
          a.score >= 0 &&
          a.score <= 100 &&
          typeof a.correct === 'boolean' &&
          typeof a.status === 'string',
      )
    )
      return invalid();
    if (d.selected !== null && !d.questions[d.index].options.some((g) => g.id === d.selected))
      return invalid();
    // Restore canonical curriculum data; never trust saved glyph paths or text.
    d.questions = d.questions.map((q) => ({
      ...q,
      glyph: known.get(q.glyph.id)!,
      options: q.options.map((g) => known.get(g.id)!),
    }));
  }
  return p;
}
let queue = Promise.resolve();
export function saveProgress(p: Progress): Promise<void> {
  const snapshot = JSON.parse(JSON.stringify(p));
  const write = queue.catch(() => {}).then(() => store.set('progress-v1', snapshot));
  queue = write;
  return write;
}
