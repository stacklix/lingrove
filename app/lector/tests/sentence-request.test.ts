import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ complete: vi.fn(), getAppLanguage: vi.fn() }));
vi.mock('@lingrove/host-sdk', () => ({
  llm: { complete: mocks.complete },
  getAppLanguage: mocks.getAppLanguage,
}));
import { analyzeSentence } from '../src/sentence-analysis';
import { analysis } from './analysis-fixture';
import { demoSource } from '../src/demo';
const context = { before: '前の文。', after: '次の文。' };
const response = (data: unknown) => ({ text: JSON.stringify(data) });
beforeEach(() => {
  mocks.complete.mockReset();
  mocks.getAppLanguage.mockReset().mockResolvedValue('en');
});
it('restores indentation, newlines and component whitespace without another request', async () => {
  const source = '\n　' + demoSource.replace('図書館', '図書\n館') + '\n';
  mocks.complete.mockResolvedValue(response(analysis));
  const result = await analyzeSentence(source, context, new AbortController().signal);
  expect(result.analysis_text).toBe(source);
  expect(result.structure[2].text).toBe('図書\n館で');
  expect(result.language).toBe('en');
  expect(mocks.complete).toHaveBeenCalledTimes(1);
  expect(mocks.complete.mock.calls[0][0].system).toContain('must use en');
  expect(mocks.complete.mock.calls[0][0].system).not.toContain('Chinese');
});
it.each([
  ['missing fields', { ...analysis, summary: undefined }],
  ['contradictory correctness', { ...analysis, correct: false }],
  ['fabricated component', { ...analysis, structure: [{ ...analysis.structure[0], text: '猫' }] }],
  ['rewritten source', { ...analysis, analysis_text: demoSource.replace('本', '猫') }],
])('requests exactly one correction for %s', async (_, invalid) => {
  mocks.complete.mockResolvedValueOnce(response(invalid)).mockResolvedValueOnce(response(analysis));
  const controller = new AbortController();
  const onStatus = vi.fn();
  const result = await analyzeSentence(demoSource, context, controller.signal, onStatus);
  expect(result.analysis_text).toBe(demoSource);
  expect(mocks.complete).toHaveBeenCalledTimes(2);
  const [request, options] = mocks.complete.mock.calls[1];
  expect(request.messages).toHaveLength(3);
  expect(JSON.parse(request.messages[2].content).sentence).toBe(demoSource);
  expect(JSON.parse(request.messages[2].content).validation_error).toBeTruthy();
  expect(options).toEqual({ signal: controller.signal, onStatus: expect.any(Function) });
  expect(mocks.complete.mock.calls[0][0].messages).toHaveLength(1);
});
it('corrects malformed JSON once', async () => {
  mocks.complete
    .mockResolvedValueOnce({ text: '{"version":' })
    .mockResolvedValueOnce(response(analysis));
  await expect(
    analyzeSentence(demoSource, context, new AbortController().signal),
  ).resolves.toHaveProperty('analysis_text', demoSource);
  expect(mocks.complete).toHaveBeenCalledTimes(2);
});
it.each([demoSource.replace('。', '!'), demoSource.replace('本', '猫'), '前の文。' + demoSource])(
  'never accepts changes to punctuation, words or sentence boundaries',
  async (text) => {
    mocks.complete.mockResolvedValue(response({ ...analysis, analysis_text: text }));
    await expect(
      analyzeSentence(demoSource, context, new AbortController().signal),
    ).rejects.toThrow('原文不一致');
    expect(mocks.complete).toHaveBeenCalledTimes(2);
  },
);
it('does not retry network failures', async () => {
  mocks.complete.mockRejectedValue(new Error('连接失败'));
  await expect(analyzeSentence(demoSource, context, new AbortController().signal)).rejects.toThrow(
    '连接失败',
  );
  expect(mocks.complete).toHaveBeenCalledTimes(1);
});
it('does not repair or accept a response after cancellation', async () => {
  const controller = new AbortController();
  mocks.complete.mockImplementation(async () => {
    controller.abort();
    return response(analysis);
  });
  await expect(analyzeSentence(demoSource, context, controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(mocks.complete).toHaveBeenCalledTimes(1);
});
it('does not start a cancelled request', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(analyzeSentence(demoSource, context, controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(mocks.complete).not.toHaveBeenCalled();
});

it.each([true, false])(
  'accumulates elapsed time and final token usage across automatic correction (estimated=%s)',
  async (estimated) => {
    const onStatus = vi.fn();
    mocks.complete
      .mockImplementationOnce(async (_request, options) => {
        options.onStatus({ elapsedMs: 0, outputTokens: 0, estimated: true });
        options.onStatus({ elapsedMs: 10000, outputTokens: 120, estimated: true });
        // Final reported usage replaces the estimate, rather than double-counting it.
        options.onStatus({ elapsedMs: 11000, outputTokens: 100, estimated });
        return response({ ...analysis, summary: undefined });
      })
      .mockImplementationOnce(async (_request, options) => {
        options.onStatus({ elapsedMs: 0, outputTokens: 0, estimated: true });
        options.onStatus({ elapsedMs: 3000, outputTokens: 40, estimated: false });
        return response(analysis);
      });
    await analyzeSentence(demoSource, context, new AbortController().signal, onStatus);
    expect(onStatus.mock.calls[3][0]).toEqual({
      elapsedMs: 11000,
      outputTokens: 100,
      estimated: true,
    });
    expect(onStatus.mock.calls[4][0]).toEqual({ elapsedMs: 14000, outputTokens: 140, estimated });
    // A separate user-initiated analysis starts a fresh total.
    mocks.complete.mockImplementationOnce(async (_request, options) => {
      options.onStatus({ elapsedMs: 0, outputTokens: 0, estimated: true });
      return response(analysis);
    });
    await analyzeSentence(demoSource, context, new AbortController().signal, onStatus);
    expect(onStatus.mock.calls.at(-1)![0].outputTokens).toBe(0);
  },
);
