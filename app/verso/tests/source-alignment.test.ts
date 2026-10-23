import { expect, it } from 'vitest';
import { parseCompactReading } from '../src/api';
import { validateReading, type Reading } from '../src/model';
import { SourceMismatchError } from '../src/source-alignment';

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
const text = (reading: Reading) =>
  reading.sentences
    .flatMap((s) => s.tokens)
    .map((t) => t.text)
    .join('');

it('restores all original whitespace without losing sentence or ruby boundaries', () => {
  const source = '\t読んだ。\r\n\r\n　読んだ。  ';
  const result = parseCompactReading(JSON.stringify({ sentences: [tokens, tokens] }), source);
  expect(text(result)).toBe(source);
  expect(result.sentences).toHaveLength(2);
  expect(result.sentences[1].tokens.find((t) => t.kind === 'word')?.ruby[0]).toEqual({
    text: '読',
    reading: 'よ',
  });
  expect(validateReading(result, source)).toEqual(result);
});
it('removes invented whitespace and restores spacing within annotated tokens', () => {
  const source = '読 ん\tだ。';
  const result = parseCompactReading(
    JSON.stringify({ sentences: [['\n', ...tokens, '　']] }),
    source,
  );
  expect(text(result)).toBe(source);
  const word = result.sentences[0].tokens.find((t) => t.kind === 'word')!;
  expect(word.ruby.map((r) => r.text).join('')).toBe(word.text);
  expect(word.ruby[0].reading).toBe('よ');
  expect(validateReading(result, source)).toEqual(result);
});
it.each(['飲んだ。', '読んだ！', '読んだ。読んだ。', '読んだ。あ'])(
  'rejects real content changes: %s',
  (source) => {
    expect(() => parseCompactReading(JSON.stringify({ sentences: [tokens] }), source)).toThrow(
      SourceMismatchError,
    );
  },
);
it('reports the original character position, not a whitespace-stripped offset', () => {
  expect(() =>
    parseCompactReading(JSON.stringify({ sentences: [tokens] }), '\n　読んだ！'),
  ).toThrow('段内第 6 个字符附近，原文应为 "！"，模型返回 "。"');
});
it('does not mutate caller-owned tokens when restoring whitespace', () => {
  const original = parseCompactReading(JSON.stringify({ sentences: [tokens] }), '読んだ。');
  const before = structuredClone(original);
  expect(text(validateReading(original, '\n読んだ。'))).toBe('\n読んだ。');
  expect(original).toEqual(before);
});
