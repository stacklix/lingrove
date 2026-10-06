import { beforeEach, describe, expect, it, vi } from 'vitest';
import { importArticle, readTextFile, splitArticle } from '../src/import';
import { demo, demoSource } from '../src/demo';
const mocks = vi.hoisted(() => ({ analyze: vi.fn() }));
vi.mock('../src/api', () => ({ analyze: mocks.analyze }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.analyze.mockResolvedValue(structuredClone(demo));
});
describe('article imports', () => {
  it('chunks long articles without losing characters and preserves sentence boundaries', () => {
    const source = demoSource.repeat(100) + '\n  ';
    const chunks = splitArticle(source);
    expect(chunks.join('')).toBe(source);
    expect(chunks.every((c) => c.length <= 240)).toBe(true);
    expect(chunks[0].endsWith('。')).toBe(true);
    expect(() => splitArticle('a'.repeat(20001))).toThrow('20,000');
    expect(() => splitArticle(' \n')).toThrow('输入');
  });
  it('returns only fully parsed lossless article data', async () => {
    const progress = vi.fn();
    const result = await importArticle(demoSource, new AbortController().signal, progress);
    expect(result).toEqual(demo);
    expect(progress).toHaveBeenLastCalledWith(1, 1);
    mocks.analyze.mockRejectedValueOnce(new Error('断流')).mockRejectedValueOnce(new Error('断流'));
    await expect(importArticle(demoSource, new AbortController().signal, progress)).rejects.toThrow(
      '断流',
    );
  });
  it('rejects cancellation even if the model resolves late', async () => {
    const abort = new AbortController();
    mocks.analyze.mockImplementation(async () => {
      abort.abort();
      return demo;
    });
    await expect(importArticle(demoSource, abort.signal, () => {})).rejects.toThrow('取消');
  });
  it('reads UTF-8 text and rejects unsupported files and bad encodings', async () => {
    const file = {
      name: '文章.txt',
      size: 100,
      arrayBuffer: async () => new TextEncoder().encode(demoSource).buffer,
    } as File;
    expect(await readTextFile(file)).toBe(demoSource);
    await expect(readTextFile({ ...file, name: '文章.pdf' } as File)).rejects.toThrow('TXT');
    await expect(
      readTextFile({ ...file, arrayBuffer: async () => new Uint8Array([0xff]).buffer } as File),
    ).rejects.toThrow('UTF-8');
  });
});

it('reports real streamed output and validated counts without advancing completion early', async () => {
  const progress = vi.fn();
  const detail = vi.fn();
  mocks.analyze.mockImplementation(async (_source, _language, _signal, update) => {
    update(120, 'receiving');
    expect(progress).toHaveBeenLastCalledWith(0, 1);
    update(240, 'validating');
    return structuredClone(demo);
  });
  await importArticle(demoSource, new AbortController().signal, progress, detail);
  expect(detail.mock.calls.map((call) => call[0].stage)).toEqual([
    'waiting',
    'receiving',
    'validating',
    'validating',
    'complete',
  ]);
  expect(detail.mock.calls.at(-1)![0]).toMatchObject({
    received: 240,
    sentences: 1,
    words: 8,
    current: 1,
    start: 1,
    end: demoSource.length,
  });
  expect(progress).toHaveBeenLastCalledWith(1, 1);
});

it('reuses validated checkpoints after a later segment fails', async () => {
  const source = demoSource.repeat(25);
  const chunks = splitArticle(source);
  const parsed = (text: string) => ({
    language: 'ja' as const,
    sentences: Array.from({ length: text.length / demoSource.length }, () =>
      structuredClone(demo.sentences[0]),
    ),
  });
  let checkpoints: import('../src/import').CompletedPart[] = [];
  mocks.analyze.mockImplementation(async (text) => {
    if (text === chunks[1]) throw new Error('服务不可用');
    return parsed(text);
  });
  await expect(
    importArticle(
      source,
      new AbortController().signal,
      () => {},
      () => {},
      [],
      async (parts) => {
        checkpoints = parts;
      },
    ),
  ).rejects.toThrow('服务不可用');
  expect(checkpoints).toHaveLength(1);
  mocks.analyze.mockReset().mockImplementation(async (text) => parsed(text));
  const result = await importArticle(
    source,
    new AbortController().signal,
    () => {},
    () => {},
    checkpoints,
  );
  expect(
    result.sentences
      .flatMap((s) => s.tokens)
      .map((t) => t.text)
      .join(''),
  ).toBe(source);
  expect(mocks.analyze).toHaveBeenCalledTimes(chunks.length - 1);
});
it('retries a transient timeout once and completes without replaying the article', async () => {
  mocks.analyze
    .mockRejectedValueOnce(new Error('请求超时'))
    .mockResolvedValueOnce(structuredClone(demo));
  const detail = vi.fn();
  const checkpoint = vi.fn();
  await importArticle(demoSource, new AbortController().signal, () => {}, detail, [], checkpoint);
  expect(mocks.analyze).toHaveBeenCalledTimes(2);
  expect(detail.mock.calls.some((c) => c[0].stage === 'retrying')).toBe(true);
  expect(checkpoint).toHaveBeenCalledTimes(1);
});
it('aborts during retry delay without sending another request', async () => {
  const abort = new AbortController();
  mocks.analyze.mockRejectedValue(new Error('timeout'));
  const pending = importArticle(
    demoSource,
    abort.signal,
    () => {},
    (value) => {
      if (value.stage === 'retrying') setTimeout(() => abort.abort(), 0);
    },
  );
  await expect(pending).rejects.toThrow('取消');
  expect(mocks.analyze).toHaveBeenCalledTimes(1);
});

it('retries only the corrupt segment and preserves completed checkpoints', async () => {
  const source = demoSource.repeat(25);
  const chunks = splitArticle(source);
  const parsed = (s: string) => ({
    language: 'ja' as const,
    sentences: Array.from({ length: s.length / demoSource.length }, () =>
      structuredClone(demo.sentences[0]),
    ),
  });
  let failed = false;
  mocks.analyze.mockImplementation(async (s) => {
    if (s === chunks[1] && !failed) {
      failed = true;
      return parsed(s + demoSource);
    }
    return parsed(s);
  });
  const checkpoint = vi.fn();
  const result = await importArticle(
    source,
    new AbortController().signal,
    () => {},
    () => {},
    [],
    checkpoint,
  );
  expect(
    result.sentences
      .flatMap((s) => s.tokens)
      .map((t) => t.text)
      .join(''),
  ).toBe(source);
  expect(mocks.analyze.mock.calls.map((call) => call[0])).toEqual([
    chunks[0],
    chunks[1],
    chunks[1],
    ...chunks.slice(2),
  ]);
  expect(checkpoint).toHaveBeenCalledTimes(chunks.length);
});
it('limits content retries and reports the failed segment and source difference', async () => {
  mocks.analyze.mockResolvedValue({
    language: 'ja',
    sentences: [...structuredClone(demo.sentences), ...structuredClone(demo.sentences)],
  });
  await expect(importArticle(demoSource, new AbortController().signal, () => {})).rejects.toThrow(
    /第 1 段分析失败（已尝试 2 次）.*原文不一致.*段内第/,
  );
  expect(mocks.analyze).toHaveBeenCalledTimes(2);
});
