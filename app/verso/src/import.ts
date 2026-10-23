import type { LLMStatus } from '@lingrove/host-sdk';
import { SourceMismatchError } from './source-alignment';
import { analyze } from './api';
import { MAX_ARTICLE_LENGTH, validateReading, type Reading, type Language } from './model';
export const CHUNK_LENGTH = 240;
export interface CompletedPart {
  start: number;
  source: string;
  reading: Reading;
}
export function splitArticle(source: string): string[] {
  if (!source.trim()) throw new Error('请输入或导入文本。');
  if (source.length > MAX_ARTICLE_LENGTH)
    throw new Error(`文章最多 ${MAX_ARTICLE_LENGTH.toLocaleString()} 字符。`);
  const chunks: string[] = [];
  let rest = source;
  while (rest.length > CHUNK_LENGTH) {
    const window = rest.slice(0, CHUNK_LENGTH);
    const breaks = [...window.matchAll(/[。！？\n]/g)];
    let end = breaks.length ? breaks.at(-1)!.index! + 1 : CHUNK_LENGTH;
    if (end < 40) end = CHUNK_LENGTH;
    if (/[\uD800-\uDBFF]/.test(rest[end - 1])) end--;
    chunks.push(rest.slice(0, end));
    rest = rest.slice(end);
  }
  if (rest) chunks.push(rest);
  // Attach whitespace-only tails to an adjacent chunk without sending blank prompts.
  return chunks;
}
export interface ImportDetail {
  requestStatus?: LLMStatus;
  stage: 'waiting' | 'receiving' | 'validating' | 'retrying' | 'repairing' | 'complete';
  attempt: number;
  current: number;
  start: number;
  end: number;
  preview: string;
  received: number;
  sentences: number;
  words: number;
}
export async function importArticle(
  source: string,
  signal: AbortSignal,
  progress: (done: number, total: number) => void,
  detail: (value: ImportDetail) => void = () => {},
  completed: CompletedPart[] = [],
  checkpoint: (parts: CompletedPart[]) => Promise<void> = async () => {},
  language: Language = 'ja',
): Promise<Reading> {
  const chunks = splitArticle(source);
  const reading: Reading = { language, sentences: [] };
  let offset = 0;
  let received = 0;
  let requestStatus: LLMStatus | undefined;
  let attempt = 1;
  const report = (stage: ImportDetail['stage'], index: number, chunk: string) => {
    if (signal.aborted) return;
    detail({
      requestStatus,
      stage,
      attempt,
      current: index + 1,
      start: offset + 1,
      end: offset + chunk.length,
      preview: chunk.slice(0, 100),
      received,
      sentences: reading.sentences.length,
      words: reading.sentences.reduce(
        (n, s) => n + s.tokens.filter((t) => t.kind === 'word').length,
        0,
      ),
    });
  };
  for (let index = 0; index < chunks.length; index++) {
    if (signal.aborted) throw new DOMException('已取消', 'AbortError');
    progress(index, chunks.length);
    const chunk = chunks[index];
    attempt = 1;
    requestStatus = undefined;
    report('waiting', index, chunk);
    if (!chunk.trim() && reading.sentences.length) {
      reading.sentences.at(-1)!.tokens.push({
        text: chunk,
        kind: 'separator',
        ruby: [],
        lemma: '',
        reading: '',
        meaning: '',
        pos: '',
        role: '',
        grammar: '',
      });
      offset += chunk.length;
      continue;
    }
    // Leading blank chunks are joined to the following parsed sentence after analysis.
    if (!chunk.trim()) {
      offset += chunk.length;
      continue;
    }
    let parsed: Reading | undefined;
    const saved = completed.find((part) => part.start === offset && part.source === chunk && part.reading.language === language);
    if (saved) {
      try {
        parsed = validateReading(saved.reading, chunk);
      } catch {
        /* Recompute invalid checkpoints. */
      }
    }
    if (!parsed) {
      for (attempt = 1; attempt <= 2; attempt++) {
        if (attempt > 1) report('waiting', index, chunk);
        const previousReceived = received;
        requestStatus = undefined;
        try {
          parsed = await analyze(chunk, language, signal, (count, stage, status) => {
            if (status) requestStatus = status;
            received = previousReceived + count;
            report(stage, index, chunk);
          });
          if (signal.aborted) throw new DOMException('已取消', 'AbortError');
          parsed = validateReading(parsed, chunk);
          break;
        } catch (e) {
          if (signal.aborted) throw new DOMException('已取消', 'AbortError');
          const message = e instanceof Error ? e.message : String(e);
          if (
            attempt === 2 ||
            (!(e instanceof SourceMismatchError) &&
              !/超时|timeout|timed out|断流|连接|network|connection|502|503|504|不完整|注音格式无效|注音片段无效|缺少注音结果/i.test(
                message,
              ))
          )
            throw e instanceof SourceMismatchError
              ? new Error(
                  `第 ${index + 1} 段分析失败（已尝试 ${attempt} 次）：${message} 点击“继续分析”仅重试未完成段落，已完成结果已保存。`,
                )
              : e;
          report('retrying', index, chunk);
          if (signal.aborted) throw new DOMException('已取消', 'AbortError');
          await new Promise<void>((resolve, reject) => {
            const abort = () => {
              clearTimeout(timer);
              reject(new DOMException('已取消', 'AbortError'));
            };
            const timer = setTimeout(() => {
              signal.removeEventListener('abort', abort);
              resolve();
            }, 1000);
            signal.addEventListener('abort', abort, { once: true });
          });
        }
      }
      const clean = validateReading(parsed, chunk);
      completed = [
        ...completed.filter((part) => part.start !== offset),
        { start: offset, source: chunk, reading: clean },
      ];
      await checkpoint(completed);
      parsed = validateReading(clean, chunk);
    }
    if (signal.aborted) throw new DOMException('已取消', 'AbortError');
    const leading = index > 0 && !reading.sentences.length ? chunks.slice(0, index).join('') : '';
    if (leading)
      parsed.sentences[0].tokens.unshift({
        text: leading,
        kind: 'separator',
        ruby: [],
        lemma: '',
        reading: '',
        meaning: '',
        pos: '',
        role: '',
        grammar: '',
      });
    reading.sentences.push(...parsed.sentences);
    report('validating', index, chunk);
    offset += chunk.length;
  }
  if (signal.aborted) throw new DOMException('已取消', 'AbortError');
  const result = validateReading(reading, source);
  progress(chunks.length, chunks.length);
  offset -= chunks.at(-1)!.length;
  report('complete', chunks.length - 1, chunks.at(-1)!);
  return result;
}
export async function readTextFile(file: File): Promise<string> {
  if (!/\.(txt|md)$/i.test(file.name))
    throw new Error('目前支持 TXT、Markdown 文本文件（UTF-8）。');
  if (file.size > 200000) throw new Error('文件过大，请导入 200 KB 以内的文本文件。');
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new Error('文件不是 UTF-8 文本，请转换编码后重试。');
  }
  if (text.includes('\0')) throw new Error('文件包含非文本内容。');
  splitArticle(text);
  return text;
}
