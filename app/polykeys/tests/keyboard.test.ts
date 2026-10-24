import { describe, expect, it } from 'vitest';
import { deleteSelection, layouts, letterCase, replaceSelection } from '../src/keyboard';
import { vietnameseVariants } from '../src/vietnamese';
describe('multilingual text editing', () => {
  it('covers Arabic letters, variants, diacritics, punctuation and numerals', () => {
    const layout = layouts.find(item => item.id === 'ar')!;
    const available = layout.rows.join('') + layout.extra;
    for (const char of 'ابتثجحخدذرزسشصضطظعغفقكلمنهويءةىأإآؤئٱًٌٍَُِّْٰـ،؛؟٠١٢٣٤٥٦٧٨٩') {
      expect(available).toContain(char);
      expect(letterCase(char, true, 'ar')).toBe(char);
    }
    expect(new Set(available).size).toBe([...available].length);
    // Text remains logical Unicode, so lam-alef is two ordinary letters.
    expect(replaceSelection('سل', 2, 2, 'ا')).toEqual({ text: 'سلا', caret: 3 });
    expect(deleteSelection('سلَّا', 4, 4)).toEqual({ text: 'سا', caret: 1 });
  });
  it('covers Vietnamese vowels with every tone in both cases', () => {
    const layout = layouts.find(item => item.id === 'vi')!;
    const available = layout.rows.join('') + [...'aeiouyd'].flatMap(vietnameseVariants).join('');
    expect(layout.extra).toBe('');
    expect(layout.rows).toEqual(['qwertyuiop', 'asdfghjkl', 'zxcvbnm']);
    for (const vowel of 'aăâeêioôơuưy') {
      for (const tone of ['', '\u0301', '\u0300', '\u0309', '\u0303', '\u0323']) {
        const char = (vowel + tone).normalize('NFC');
        expect(available).toContain(char);
        expect(letterCase(char, true, 'vi')).toBe(char.toLocaleUpperCase('vi'));
      }
    }
    expect(available).toContain('đ');
    expect(new Set(layout.extra).size).toBe(layout.extra.length);
  });
  it('matches both Georgian screenshot states and covers all 33 modern letters', () => {
    const layout = layouts.find(item => item.id === 'ka')!;
    expect(layout.rows).toEqual(['ქწერტყუიოპ', 'ასდფგჰჯკლ', 'ზხცვბნმ']);
    const shifted = layout.rows.map(row => [...row].map(char => letterCase(char, true, 'ka')).join(''));
    expect(shifted).toEqual(['ქჭეღთყუიოპ', 'აშდფგჰჟკლ', 'ძხჩვბნმ']);
    expect([...new Set(layout.rows.join('') + shifted.join(''))].sort().join('')).toBe('აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ');
    expect(layout.extra).toBe('');
  });
  it('keeps all Armenian letters in the four screenshot rows with their uppercase forms', () => {
    const layout = layouts.find(item => item.id === 'hy')!;
    expect(layout.rows).toEqual(['էթփձջևրչճժշ', 'քոեռտըւիօպխ', 'ասդֆգհյկլծ', 'զղցվբնմ']);
    expect(layout.rows.map(row => [...row].map(char => letterCase(char, true, 'hy')).join('')))
      .toEqual(['ԷԹՓՁՋԵՒՐՉՃԺՇ', 'ՔՈԵՌՏԸՒԻՕՊԽ', 'ԱՍԴՖԳՀՅԿԼԾ', 'ԶՂՑՎԲՆՄ']);
    expect([...new Set(layout.rows.join(''))].sort().join('')).toBe('աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆև');
    expect(layout.extra).toBe('');
  });
  it('offers one iPhone layout per language, preferring existing QWERTY variants', () => {
    expect(new Set(layouts.map(item => item.locale)).size).toBe(layouts.length);
    expect(new Set(layouts.map(item => item.id)).size).toBe(layouts.length);
    for (const id of ['en', 'pt', 'it', 'tr']) {
      expect(layouts.find(item => item.id === id)!.rows).toEqual(['qwertyuiop', 'asdfghjkl', 'zxcvbnm']);
    }
    expect(layouts.find(item => item.id === 'fr')!.rows).toEqual(['qwertyuiop', "asdfghjkl'", 'zxcvbnm']);
    expect(layouts.find(item => item.id === 'de')!.rows).toEqual(['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm']);
    expect(layouts.find(item => item.id === 'ru')!.rows).toEqual(['яшертыуиопэ', 'асдфгчйклжщ', 'зхцвбнмью']);
    expect(layouts.find(item => item.id === 'uk')!.rows).toEqual(['йцукенгшщзхї', "фівапролджє'", 'ячсмитьбюґ']);
    expect(layouts.find(item => item.id === 'el')!.rows).toEqual(['ερτυθιοπ΄', 'ασδφγηξκλ', 'ζχψωβνμ']);
    expect(layouts.find(item => item.id === 'es')!.rows[1]).toBe('asdfghjklñ');
  });
  it('keeps complete Russian and Ukrainian alphabets available', () => {
    for (const [id, alphabet] of [
      ['ru', 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'],
      ['uk', 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя'],
    ]) {
      const item = layouts.find(layout => layout.id === id)!;
      const characters = [...new Set(item.rows.join('') + item.extra)].filter(char => char !== "'").sort();
      expect(characters).toEqual([...alphabet].sort());
    }
  });
  it('inserts at the cursor and replaces selected text', () => {
    expect(replaceSelection('hello world', 6, 11, 'κόσμε')).toEqual({ text: 'hello κόσμε', caret: 11 });
    expect(replaceSelection('ab', 1, 1, 'ñ')).toEqual({ text: 'añb', caret: 2 });
  });
  it('deletes selections and whole composed characters', () => {
    expect(deleteSelection('a👩‍💻', 6, 6)).toEqual({ text: 'a', caret: 1 });
    expect(deleteSelection('aé', 3, 3)).toEqual({ text: 'a', caret: 1 });
    expect(deleteSelection('hello', 1, 4)).toEqual({ text: 'ho', caret: 1 });
    expect(deleteSelection('', 0, 0)).toEqual({ text: '', caret: 0 });
  });
  it('uses Turkish casing and language-specific letters', () => {
    expect(letterCase('i', true, 'tr')).toBe('İ');
    expect(letterCase('ı', true, 'tr')).toBe('I');
    expect(layouts.find(l => l.id === 'de')!.extra).toBe('ß');
    expect(layouts.find(l => l.id === 'uk')!.rows[0]).toContain('ї');
  });
});
