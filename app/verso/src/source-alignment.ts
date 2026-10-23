import type { Reading, Token } from './model';

const withoutWhitespace = (text: string) => text.replace(/\s/gu, '');

export class SourceMismatchError extends Error {
  constructor(source: string, returned: string) {
    const expected = [...source];
    const actual = [...returned].filter((char) => !/\s/u.test(char));
    let index = 0;
    let position = 0;
    for (; position < expected.length; position++) {
      if (/\s/u.test(expected[position])) continue;
      if (expected[position] !== actual[index]) break;
      index++;
    }
    const excerpt = expected.slice(Math.max(0, position - 6), position + 10).join('');
    super(
      `原文不一致：段内第 ${position + 1} 个字符附近，原文应为 ${JSON.stringify(expected[position] ?? '〈结尾〉')}，模型返回 ${JSON.stringify(actual[index] ?? '〈结尾〉')}。原文片段：${JSON.stringify(excerpt)}。`,
    );
    this.name = 'SourceMismatchError';
  }
}

// Only whitespace is recoverable locally. Punctuation, Unicode forms and all
// lexical characters must remain identical and in order before reusing ruby.
export function assertSourceContent(source: string, returned: string) {
  if (withoutWhitespace(source) !== withoutWhitespace(returned))
    throw new SourceMismatchError(source, returned);
}

export function restoreSourceWhitespace(reading: Reading, source: string): Reading {
  const returned = reading.sentences
    .flatMap((s) => s.tokens)
    .map((t) => t.text)
    .join('');
  if (returned === source) return reading;
  assertSourceContent(source, returned);
  let cursor = 0;
  const separator = (text: string): Token => ({
    text,
    kind: 'separator',
    ruby: [],
    lemma: '',
    reading: '',
    meaning: '',
    pos: '',
    role: '',
    grammar: '',
  });
  const whitespace = () => {
    const start = cursor;
    while (cursor < source.length && /\s/u.test(source[cursor])) cursor++;
    return source.slice(start, cursor);
  };
  const consume = (text: string) => {
    const start = cursor;
    for (const char of withoutWhitespace(text)) {
      whitespace();
      cursor += char.length;
    }
    return source.slice(start, cursor);
  };
  for (const sentence of reading.sentences) {
    const tokens: Token[] = [];
    for (const token of sentence.tokens) {
      if (!withoutWhitespace(token.text)) continue;
      const leading = whitespace();
      if (leading) tokens.push(separator(leading));
      if (token.kind === 'separator') tokens.push(separator(consume(token.text)));
      else {
        const ruby = token.ruby
          .filter((part) => withoutWhitespace(part.text))
          .map((part) => ({ ...part, text: consume(part.text) }));
        tokens.push({ ...token, ruby, text: ruby.map((part) => part.text).join('') });
      }
    }
    sentence.tokens = tokens;
  }
  reading.sentences = reading.sentences.filter((sentence) => sentence.tokens.length);
  const trailing = whitespace();
  if (trailing) reading.sentences.at(-1)?.tokens.push(separator(trailing));
  return reading;
}
