import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateArticle, generationLevels, type GenerationInput } from '../src/generation';
import { MAX_ARTICLE_LENGTH } from '../src/model';

const mocks = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock('@lingrove/host-sdk', () => ({ llm: { complete: mocks.complete } }));
const input: GenerationInput = {
  language: 'ja',
  level: 'N5',
  topic: '日常生活',
  length: 300,
  constraints: '',
};
beforeEach(() => {
  mocks.complete
    .mockReset()
    .mockResolvedValue({ text: JSON.stringify({ title: '朝', source: '朝、公園に行きました。' }) });
});

describe('article generation', () => {
  it.each(['en', 'ru', 'el'] as const)('uses CEFR and word counts for %s', async (language) => {
    const signal = new AbortController().signal;
    const onStatus = vi.fn();
    const article = await generateArticle(
      { ...input, language, level: 'B2', constraints: 'Use dialogue.' },
      { signal, onStatus },
    );
    expect(generationLevels(language)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
    expect(JSON.parse(mocks.complete.mock.calls[0][0].messages[0].content)).toMatchObject({
      language,
      level: 'B2',
      length: 300,
      lengthUnit: 'words',
      constraints: 'Use dialogue.',
    });
    expect(mocks.complete.mock.calls[0][1]).toEqual({ signal, onStatus });
    expect(article.language).toBe(language);
  });
  it('uses Japanese and Chinese levels with character counts and trims content', async () => {
    expect(generationLevels('ja')).toEqual(['N5', 'N4', 'N3', 'N2', 'N1']);
    expect(generationLevels('zh')).toEqual(['初级', '中级', '高级']);
    mocks.complete.mockResolvedValue({
      text: '```json\n{"title":" 朝 ","source":" 公園へ。\\n次の日。 "}\n```',
    });
    expect(await generateArticle(input)).toEqual({
      title: '朝',
      source: '公園へ。\n次の日。',
      language: 'ja',
    });
    expect(JSON.parse(mocks.complete.mock.calls[0][0].messages[0].content).lengthUnit).toBe(
      'characters',
    );
    await generateArticle({ ...input, language: 'zh', level: '初级' });
    expect(JSON.parse(mocks.complete.mock.calls[1][0].messages[0].content).lengthUnit).toBe(
      'characters',
    );
  });
  it.each([
    { level: 'A1' },
    { language: 'en' as const, level: 'N5' },
    { topic: '   ' },
    { topic: 'a'.repeat(201) },
    { length: 0 },
    { length: 2001 },
    { length: 100.5 },
    { length: NaN },
    { constraints: 'a'.repeat(1001) },
  ])('rejects invalid options before making a request: %j', async (patch) => {
    await expect(generateArticle({ ...input, ...patch })).rejects.toThrow();
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it.each([
    'null',
    '{}',
    'not JSON',
    '{"title":"标题","source":""}',
    JSON.stringify({ title: 'T', source: 'a'.repeat(MAX_ARTICLE_LENGTH + 1) }),
  ])('rejects incomplete or oversized output', async (text) => {
    mocks.complete.mockResolvedValue({ text });
    await expect(generateArticle(input)).rejects.toThrow('未能生成完整文章，请重试。');
  });
  it('does not accept a response after cancellation', async () => {
    const controller = new AbortController();
    mocks.complete.mockImplementation(async () => {
      controller.abort();
      return { text: '{"title":"T","source":"Text"}' };
    });
    await expect(generateArticle(input, { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
