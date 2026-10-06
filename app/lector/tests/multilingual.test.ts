import { expect, it } from 'vitest';
import { analyze } from '../src/api';
import { validateReading, type Language } from '../src/model';
import { splitReadingSentences } from '../src/reading-layout';

it.each([
  ['en', 'Hello world. Next sentence!'],
  ['zh', '你好世界。下一句话！'],
  ['ru', 'Привет, мир!'],
  ['el', 'Γεια σου κόσμε!'],
] as [Language, string][])(
  'imports %s without Japanese annotations and preserves the original',
  async (language, source) => {
    const result = await analyze(source, language, new AbortController().signal, () => {});
    expect(result.language).toBe(language);
    expect(
      result.sentences
        .flatMap((s) => s.tokens)
        .map((t) => t.text)
        .join(''),
    ).toBe(source);
    expect(
      result.sentences
        .flatMap((s) => s.tokens)
        .flatMap((t) => t.ruby)
        .every((p) => p.reading === ''),
    ).toBe(true);
    expect(validateReading({ ...result, language: 'ja' }, source).language).toBe('ja');
    if (language === 'en') expect(splitReadingSentences(result.sentences)).toHaveLength(2);
  },
);
