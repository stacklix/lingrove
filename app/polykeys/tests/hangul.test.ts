import { describe, expect, it } from 'vitest';
import { appendHangul } from '../src/hangul';
import { letterCase } from '../src/keyboard';
const type = (keys: string) => [...keys].reduce(appendHangul, '');
describe('Korean two-set composition', () => {
  it('combines initials, vowels, and finals into words', () => {
    expect(type('ㅎㅏㄴㄱㅡㄹ')).toBe('한글');
    expect(type('ㅇㅏㄴㄴㅕㅇㅎㅏㅅㅔㅇㅛ')).toBe('안녕하세요');
    expect(type('ㄲㅏㅁㅉㅏㄱ')).toBe('깜짝');
  });
  it('combines vowels and splits finals before the next vowel', () => {
    expect(type('ㄱㅗㅏ')).toBe('과');
    expect(type('ㅇㅜㅓㄴ')).toBe('원');
    expect(type('ㄱㅏㄴㅏ')).toBe('가나');
    expect(type('ㅇㅣㄹㄱㅓ')).toBe('일거');
    expect(type('ㅇㅣㄹㄱㅇㅓ')).toBe('읽어');
    expect(type('ㄱㅏㅂㅅㅣ')).toBe('갑시');
    expect(type('ㄷㅏㄹㄱ')).toBe('닭');
    expect(type('ㅗㅏ')).toBe('ㅘ');
  });
  it('provides the shifted two-set keys', () => {
    expect(letterCase('ㄱ', true, 'ko')).toBe('ㄲ');
    expect(letterCase('ㅐ', true, 'ko')).toBe('ㅒ');
    expect(letterCase('ㅏ', true, 'ko')).toBe('ㅏ');
  });
});
