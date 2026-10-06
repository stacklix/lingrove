import { splitReadingSentences } from './reading-layout';
import type { CompletedPart } from './import';
import { validateAnalysis, type SentenceAnalysis } from './sentence-analysis';
import { moduleStorage } from '@lingrove/host-sdk';
import { MAX_ARTICLE_LENGTH, validateReading, type SavedReading } from './model';
export interface AnalysisJob {
  id: string;
  source: string;
  title: string;
  origin: string;
  createdAt: number;
  status: 'queued' | 'running' | 'paused' | 'failed' | 'ready';
  parts?: CompletedPart[];
  done: number;
  total: number;
  error: string;
}
export interface State {
  draft: string;
  draftTitle: string;
  draftOrigin: string;
  jobs: AnalysisJob[];
  ruby: boolean;
  library: SavedReading[];
  activeID: string;
}
export const freshState = (): State => ({
  draft: '',
  draftTitle: '',
  draftOrigin: '文本导入',
  jobs: [],
  ruby: true,
  library: [],
  activeID: '',
});
const count = (n: unknown): number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : 0;
const storage = moduleStorage('lector');
export async function loadState(): Promise<State> {
  const raw = await storage.get<State>('reading-v1');
  if (raw === null) return freshState();
  if (typeof raw !== 'object' || !Array.isArray(raw.library)) throw new Error('保存的数据无法读取');
  const library = raw.library.map((item) => {
    if (
      !item ||
      typeof item.id !== 'string' ||
      typeof item.source !== 'string' ||
      !Number.isFinite(item.createdAt)
    )
      throw new Error('阅读记录损坏');
    const reading = validateReading(item.reading, item.source);
    const sentenceCount = splitReadingSentences(reading.sentences).length;
    const analyses: Record<string, SentenceAnalysis> = {};
    if (item.analyses && typeof item.analyses === 'object')
      for (const [key, value] of Object.entries(item.analyses)) {
        if (
          typeof value?.analysis_text !== 'string' ||
          !value.analysis_text.trim() ||
          !item.source.includes(value.analysis_text)
        )
          continue;
        try {
          analyses[key] = validateAnalysis(value, value.analysis_text);
        } catch {
          /* A bad cache must not prevent opening the book. */
        }
      }
    return {
      ...item,
      analyses,
      reading,
      title:
        typeof item.title === 'string' ? item.title.slice(0, 120) : item.source.trim().slice(0, 36),
      origin: typeof item.origin === 'string' ? item.origin : '文本导入',
      stats: {
        opens: count(item.stats?.opens),
        seconds: count(item.stats?.seconds),
        lookups: count(item.stats?.lookups),
        visited: [
          ...new Set(
            (item.stats?.visited ?? []).filter(
              (n: number) => Number.isInteger(n) && n >= 0 && n < sentenceCount,
            ),
          ),
        ],
        lastRead: count(item.stats?.lastRead),
      },
      sentence: Number.isInteger(item.sentence)
        ? Math.max(0, Math.min(item.sentence, sentenceCount - 1))
        : 0,
    };
  });
  return {
    draft: typeof raw.draft === 'string' ? raw.draft.slice(0, MAX_ARTICLE_LENGTH) : '',
    draftTitle: typeof raw.draftTitle === 'string' ? raw.draftTitle.slice(0, 120) : '',
    draftOrigin: typeof raw.draftOrigin === 'string' ? raw.draftOrigin : '文本导入',
    jobs: Array.isArray(raw.jobs)
      ? raw.jobs
          .filter(
            (j) =>
              j &&
              typeof j.id === 'string' &&
              typeof j.source === 'string' &&
              j.source.trim() &&
              j.source.length <= MAX_ARTICLE_LENGTH &&
              !library.some((item) => item.id === j.id),
          )
          .map((j) => ({
            id: j.id,
            parts: Array.isArray(j.parts)
              ? j.parts.filter(
                  (p) =>
                    p &&
                    Number.isInteger(p.start) &&
                    p.start >= 0 &&
                    typeof p.source === 'string' &&
                    j.source.slice(p.start, p.start + p.source.length) === p.source,
                )
              : [],
            source: j.source,
            title: typeof j.title === 'string' ? j.title : j.source.slice(0, 36),
            origin: typeof j.origin === 'string' ? j.origin : '文本导入',
            createdAt: count(j.createdAt),
            status: j.status === 'failed' ? 'failed' : 'paused',
            done: count(j.done),
            total: Math.max(1, count(j.total)),
            error:
              j.status === 'failed' && typeof j.error === 'string'
                ? j.error
                : '上次分析已中断，可继续未完成的段落。',
          }))
      : [],
    ruby: raw.ruby !== false,
    activeID: typeof raw.activeID === 'string' ? raw.activeID : '',
    library,
  };
}
// Serialize snapshots so a slower bridge write cannot overwrite newer user state.
let writes: Promise<void> = Promise.resolve();
export function saveState(state: State): Promise<void> {
  if (new TextEncoder().encode(JSON.stringify(state)).length > 7 * 1024 * 1024)
    return Promise.reject(new Error('本地存储空间不足'));
  const snapshot = JSON.parse(JSON.stringify(state));
  writes = writes.catch(() => {}).then(() => storage.set('reading-v1', snapshot));
  return writes;
}
