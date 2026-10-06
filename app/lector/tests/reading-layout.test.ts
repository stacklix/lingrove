import { expect, it } from 'vitest';
import { readingLayout } from '../src/reading-layout';
import { demo } from '../src/demo';

it('keeps paragraph whitespace after the analysis action without modifying stored content', () => {
  const sentence = structuredClone(demo.sentences[0]);
  sentence.tokens.push({
    ...sentence.tokens.find((t) => t.kind === 'separator')!,
    text: '\r\n　\n',
  });
  const before = structuredClone(sentence);
  const layout = readingLayout(sentence);
  expect(layout.trailing).toBe('\r\n　\n');
  expect(layout.tokens.map((t) => t.text).join('') + layout.trailing).toBe(
    sentence.tokens.map((t) => t.text).join(''),
  );
  expect(sentence).toEqual(before);
});

it('retains inline spaces and does not insert line breaks between sentences', () => {
  const sentence = structuredClone(demo.sentences[0]);
  const layout = readingLayout(sentence);
  expect(layout.trailing).toBe('');
  expect(layout.tokens).toEqual(sentence.tokens);
});

import { splitReadingSentences } from '../src/reading-layout';
const word = (text: string) => ({
  ...demo.sentences[0].tokens[0],
  text,
  ruby: [{ text, reading: '' }],
});
const sep = (text: string) => ({ ...word(text), kind: 'separator' as const, ruby: [] });
const texts = (sentences: ReturnType<typeof splitReadingSentences>) =>
  sentences.map((s) => s.tokens.map((t) => t.text).join(''));
it('splits three sentences in one model batch and preserves spaces and ruby', () => {
  const original = [
    {
      tokens: [
        word('出ました'),
        sep('。 '),
        word('食べました'),
        sep('。 '),
        word('帰りました'),
        sep('。\n'),
      ],
      translation: '',
      explanation: '',
    },
  ];
  const before = structuredClone(original);
  expect(texts(splitReadingSentences(original))).toEqual([
    '出ました。 ',
    '食べました。 ',
    '帰りました。\n',
  ]);
  expect(original).toEqual(before);
});
it('joins model batches within one sentence and retains quoted punctuation', () => {
  const original = [
    {
      tokens: [sep('「'), word('はい'), sep('。」'), word('と言った')],
      translation: '',
      explanation: '',
    },
    {
      tokens: [sep('。\n'), word('ほんとう'), sep('！？ '), word('はい'), sep('。')],
      translation: '',
      explanation: '',
    },
  ];
  expect(texts(splitReadingSentences(original))).toEqual([
    '「はい。」と言った。\n',
    'ほんとう！？ ',
    'はい。',
  ]);
});
