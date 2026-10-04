import { moduleStorage } from '@lingrove/host-sdk';
import { glyphs, type Group } from './curriculum';
import type { Answer } from './session';
export interface Practice {
  id: string;
  score: number;
  correct: boolean;
  tracing: boolean;
  at: string;
}
export interface RoundRecord {
  id: string;
  language: string;
  group?: Group;
  at: string;
  answers: Answer[];
}
export interface History {
  practices: Practice[];
  rounds: RoundRecord[];
}
const store = moduleStorage('glyphora');
export async function loadHistory(): Promise<History> {
  const data = await store.get<History>('history');
  if (!data) return { practices: [], rounds: [] };
  const validIDs = new Set(glyphs.map((g) => g.id));
  const validScore = (p: any) =>
    p &&
    validIDs.has(p.id) &&
    Number.isFinite(p.score) &&
    p.score >= 0 &&
    p.score <= 100 &&
    typeof p.correct === 'boolean';
  const validDate = (value: unknown) =>
    typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (
    !Array.isArray(data.practices) ||
    !Array.isArray(data.rounds) ||
    !data.practices.every(
      (p) => validScore(p) && typeof p.tracing === 'boolean' && validDate(p.at),
    ) ||
    !data.rounds.every(
      (r) =>
        r &&
        typeof r.id === 'string' &&
        typeof r.language === 'string' &&
        validDate(r.at) &&
        Array.isArray(r.answers) &&
        r.answers.length === 10 &&
        r.answers.every(
          (a) =>
            validScore(a) && ['write', 'choice'].includes(a.type) && typeof a.status === 'string',
        ),
    )
  )
    throw new Error('练习记录格式异常，暂不写入新记录。');
  return data;
}
export const saveHistory = (data: History) =>
  store.set('history', { practices: data.practices.slice(-500), rounds: data.rounds.slice(-50) });
