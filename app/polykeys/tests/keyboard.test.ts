import { describe, expect, it } from 'vitest';
import { deleteSelection, layouts, letterCase, replaceSelection } from '../src/keyboard';
describe('multilingual text editing', () => {
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
    expect(layouts.find(l => l.id === 'de')!.rows.join('')).toContain('ö');
    expect(layouts.find(l => l.id === 'uk')!.extra).toContain('ї');
  });
});
