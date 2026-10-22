import { describe, expect, it } from 'vitest';
import { composeJapanese } from '../src/japanese';

describe('Japanese romaji composition', () => {
  it.each([
    ['konnichiha', 'こんにちは'], ['gakkou', 'がっこう'], ['shashin', 'しゃしん'],
    ['kanpai', 'かんぱい'], ["kin'youbi", 'きんようび'], ['konnya', 'こんにゃ'],
    ['xtsuxyaxa', 'っゃぁ'], ['ryokou', 'りょこう'], ['matcha', 'まっちゃ'],
  ])('converts %s', (input, expected) => {
    expect(composeJapanese(input, false, true)).toBe(expected);
  });
  it('keeps incomplete input and commits a trailing n', () => {
    expect(composeJapanese('k')).toBe('k');
    expect(composeJapanese('kan')).toBe('かn');
    expect(composeJapanese('kan', false, true)).toBe('かん');
    expect(composeJapanese('kyaku', true)).toBe('キャク');
  });
});
