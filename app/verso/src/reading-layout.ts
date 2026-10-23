import type { Sentence } from './model';

// Add paragraph breathing room only when rendering; keep source text and
// analysis/cache keys unchanged, and preserve existing blank lines.
export function paragraphSpacing(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\n(?:[^\S\n]*\n)*/g, (breaks) =>
    breaks === '\n' ? '\n\n' : breaks,
  );
}

// Put the analysis action before original trailing paragraph whitespace, while
// leaving stored text/ruby and sentence indices untouched.
export function readingLayout(sentence: Sentence) {
  const tokens = sentence.tokens.map((token) => ({
    ...token,
    ruby: token.ruby.map((part) => ({ ...part })),
  }));
  let trailing = '';
  while (tokens.length) {
    const token = tokens.at(-1)!;
    const suffix = token.text.match(/\s+$/u)?.[0];
    if (!suffix) break;
    trailing = suffix + trailing;
    token.text = token.text.slice(0, -suffix.length);
    if (!token.text) {
      tokens.pop();
      continue;
    }
    let remaining = suffix.length;
    while (remaining && token.ruby.length) {
      const part = token.ruby.at(-1)!;
      const count = Math.min(remaining, part.text.length);
      part.text = part.text.slice(0, -count);
      remaining -= count;
      if (!part.text) token.ruby.pop();
    }
    break;
  }
  return { tokens, trailing };
}

// Model sentence arrays are annotation batches, not reliable click boundaries.
// Rebuild presentation boundaries without mutating saved tokens or ruby.
export function splitReadingSentences(sentences: Sentence[]): Sentence[] {
  const result: Sentence[] = [];
  let tokens: Sentence['tokens'] = [];
  let pendingEnd = false;
  const brackets: string[] = [];
  const pairs: Record<string, string> = {
    '「': '」',
    '『': '』',
    '（': '）',
    '(': ')',
    '【': '】',
    '〈': '〉',
    '《': '》',
  };
  const flush = () => {
    if (tokens.length) result.push({ tokens, translation: '', explanation: '' });
    tokens = [];
    pendingEnd = false;
  };
  for (const token of sentences.flatMap((sentence) => sentence.tokens)) {
    if (token.kind === 'word') {
      if (pendingEnd) flush();
      tokens.push(token);
      continue;
    }
    let text = '';
    const append = () => {
      if (text) tokens.push({ ...token, text });
      text = '';
    };
    for (const char of token.text) {
      if (pendingEnd && !/[。！？.!?\s」』）)】〉》]/u.test(char)) {
        append();
        flush();
      }
      text += char;
      if (pairs[char]) brackets.push(pairs[char]);
      else if (brackets.at(-1) === char) brackets.pop();
      if (/[。！？.!?]/u.test(char) && brackets.length === 0) pendingEnd = true;
    }
    append();
  }
  flush();
  return result;
}
