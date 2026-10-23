import { beforeEach, expect, it, vi } from 'vitest';
const complete = vi.hoisted(() => vi.fn());
vi.mock('@lingrove/host-sdk', () => ({ llm: { complete } }));
import { analyze, parseCompactReading } from '../src/api';
const tokens = [
  [
    '読んだ',
    [
      ['読', 'よ'],
      ['んだ', ''],
    ],
  ],
  '。',
];
beforeEach(() => complete.mockReset());
it('retains standalone paragraph separators without requiring annotation or adding sentences', () => {
  const data = { sentences: ['\n', [...tokens], '\n\n', [...tokens], '\n'] };
  const reading = parseCompactReading(JSON.stringify(data), '\n読んだ。\n\n読んだ。\n');
  expect(reading.sentences).toHaveLength(2);
  expect(
    reading.sentences
      .flatMap((s) => s.tokens)
      .map((t) => t.text)
      .join(''),
  ).toBe('\n読んだ。\n\n読んだ。\n');
});
it('repairs only a raw eighth sentence and preserves the other seven', async () => {
  complete.mockResolvedValueOnce({
    text: JSON.stringify({ sentences: [...Array.from({ length: 7 }, () => tokens), '読んだ。'] }),
  });
  complete.mockResolvedValueOnce({ text: JSON.stringify({ repairs: [{ index: 7, tokens }] }) });
  const progress = vi.fn();
  const reading = await analyze('読んだ。'.repeat(8), 'ja', new AbortController().signal, progress);
  expect(reading.sentences).toHaveLength(8);
  expect(complete).toHaveBeenCalledTimes(2);
  expect(complete.mock.calls.every((call) => call[0].timeoutSeconds === 600)).toBe(true);
  expect(JSON.parse(complete.mock.calls[1][0].messages[0].content)).toEqual({
    sentences: [{ index: 7, text: '読んだ。' }],
  });
  expect(progress.mock.calls.some((call) => call[1] === 'repairing')).toBe(true);
});
it('batches missing sentences into one repair request without looping', async () => {
  complete.mockResolvedValueOnce({ text: JSON.stringify({ sentences: ['読んだ。', '読んだ。'] }) });
  complete.mockResolvedValueOnce({
    text: JSON.stringify({
      repairs: [
        { index: 0, tokens: '読んだ。' },
        { index: 1, tokens },
      ],
    }),
  });
  await expect(
    analyze('読んだ。読んだ。', 'ja', new AbortController().signal, () => {}),
  ).rejects.toThrow('补注音格式');
  expect(complete).toHaveBeenCalledTimes(2);
});
it('rejects rewritten or unannotated repairs instead of silently accepting them', async () => {
  complete.mockResolvedValueOnce({ text: JSON.stringify({ sentences: ['読んだ。'] }) });
  complete.mockResolvedValueOnce({
    text: JSON.stringify({
      repairs: [
        {
          index: 0,
          tokens: [
            [
              '読んだ',
              [
                ['読', ''],
                ['んだ', ''],
              ],
            ],
            '。',
          ],
        },
      ],
    }),
  });
  await expect(analyze('読んだ。', 'ja', new AbortController().signal, () => {})).rejects.toThrow(
    '注音',
  );
});
it('does not repair content which already differs from the original source', async () => {
  complete.mockResolvedValueOnce({ text: JSON.stringify({ sentences: ['飲んだ。'] }) });
  await expect(analyze('読んだ。', 'ja', new AbortController().signal, () => {})).rejects.toThrow(
    '原文',
  );
  expect(complete).toHaveBeenCalledTimes(1);
});
it('honors cancellation before requesting a repair', async () => {
  const abort = new AbortController();
  complete.mockImplementationOnce(async () => {
    abort.abort();
    return { text: JSON.stringify({ sentences: ['読んだ。'] }) };
  });
  await expect(analyze('読んだ。', 'ja', abort.signal, () => {})).rejects.toThrow('取消');
  expect(complete).toHaveBeenCalledTimes(1);
});

it('restores source whitespace after repairing unannotated sentences', async () => {
  complete.mockResolvedValueOnce({ text: JSON.stringify({ sentences: ['読んだ。'] }) });
  complete.mockResolvedValueOnce({ text: JSON.stringify({ repairs: [{ index: 0, tokens }] }) });
  const source = '\n読んだ。\r\n';
  const reading = await analyze(source, 'ja', new AbortController().signal, () => {});
  expect(
    reading.sentences
      .flatMap((s) => s.tokens)
      .map((t) => t.text)
      .join(''),
  ).toBe(source);
  expect(complete).toHaveBeenCalledTimes(2);
});
