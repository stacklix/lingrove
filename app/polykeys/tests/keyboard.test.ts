import { describe, expect, it } from 'vitest';
import { deleteSelection, layouts, letterCase, replaceSelection } from '../src/keyboard';
describe('multilingual text editing', () => {
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
