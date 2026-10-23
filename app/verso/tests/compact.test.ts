import { expect, it } from 'vitest';
import { parseCompactReading } from '../src/api';
it('expands compact annotation data and enforces lossless source/ruby', () => {
  const data = {
    sentences: [
      [
        [
          '読んだ',
          [
            ['読', 'よ'],
            ['んだ', ''],
          ],
        ],
        '。',
      ],
    ],
  };
  const result = parseCompactReading(JSON.stringify(data), '読んだ。');
  expect(result.sentences[0].tokens[0].ruby).toEqual([
    { text: '読', reading: 'よ' },
    { text: 'んだ', reading: '' },
  ]);
  expect(() => parseCompactReading(JSON.stringify(data), '読んだ！')).toThrow('原文');
  expect(() =>
    parseCompactReading(JSON.stringify({ sentences: [[['読', [['読', '']]]]] }), '読'),
  ).toThrow('注音');
  expect(() => parseCompactReading('{', '読')).toThrow('不完整');
});

it('normalizes a model sentence object without losing sentence boundaries', () => {
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
  const wrapped = { sentences: [{ tokens }, { tokens }] };
  const result = parseCompactReading(JSON.stringify(wrapped), '読んだ。読んだ。');
  expect(result.sentences).toHaveLength(2);
  expect(result.sentences[1].tokens[0].text).toBe('読んだ');
});
it('normalizes named model token fields and still rejects missing or altered text/ruby', () => {
  const word = {
    text: '読んだ',
    ruby: [
      { text: '読', reading: 'よ' },
      { text: 'んだ', reading: '' },
    ],
  };
  const data = { sentences: [{ tokens: [word, { text: '。', kind: 'separator' }] }] };
  expect(parseCompactReading(JSON.stringify(data), '読んだ。').sentences[0].tokens[0].text).toBe(
    '読んだ',
  );
  expect(() => parseCompactReading(JSON.stringify(data), '飲んだ。')).toThrow('原文');
  word.ruby[0].reading = '';
  expect(() => parseCompactReading(JSON.stringify(data), '読んだ。')).toThrow('注音');
});
it('rejects unannotated strings and missing token arrays with an actionable sentence index', () => {
  expect(() =>
    parseCompactReading(JSON.stringify({ sentences: ['読んだ。'] }), '読んだ。'),
  ).toThrow('第 1 句');
  expect(() =>
    parseCompactReading(JSON.stringify({ sentences: [{ text: '読んだ。' }] }), '読んだ。'),
  ).toThrow('第 1 句的注音生成失败，请重试。');
});
