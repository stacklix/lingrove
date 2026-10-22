export interface Layout { id: string; locale: string; name: string; rows: string[]; extra: string; }
// Select an existing iPhone layout per language; do not invent phonetic remappings.
// Variant choices and source screenshots are documented in ../README.md.
const qwerty = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
export const layouts: Layout[] = [
  { id: 'ko', locale: 'ko', name: '韩语', rows: ['ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ', 'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ', 'ㅋㅌㅊㅍㅠㅜㅡ'], extra: '' },
  { id: 'en', locale: 'en', name: '英语', rows: qwerty, extra: '' },
  { id: 'fr', locale: 'fr', name: '法语', rows: ['qwertyuiop', "asdfghjkl'", 'zxcvbnm'], extra: 'àâæçéèêëîïôœùûüÿ' },
  { id: 'de', locale: 'de', name: '德语', rows: ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm'], extra: 'ß' },
  { id: 'es', locale: 'es', name: '西班牙语', rows: ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'], extra: 'áéíóúü¿¡' },
  { id: 'pt', locale: 'pt', name: '葡萄牙语', rows: qwerty, extra: 'áàâãçéêíóôõúü' },
  { id: 'it', locale: 'it', name: '意大利语', rows: qwerty, extra: 'àèéìíîòóùú' },
  { id: 'tr', locale: 'tr', name: '土耳其语', rows: qwerty, extra: 'çğıöşüâîû' },
  { id: 'ru', locale: 'ru', name: '俄语', rows: ['яшертыуиопэ', 'асдфгчйклжщ', 'зхцвбнмью'], extra: 'ёъ' },
  { id: 'uk', locale: 'uk', name: '乌克兰语', rows: ['йцукенгшщзхї', "фівапролджє'", 'ячсмитьбюґ'], extra: '' },
  { id: 'el', locale: 'el', name: '希腊语', rows: ['ερτυθιοπ΄', 'ασδφγηξκλ', 'ζχψωβνμ'], extra: 'ςάέήίόύώϊϋΐΰ' },
];
export function letterCase(value: string, upper: boolean, language: string) {
  if (language === 'ko') return upper ? ({ 'ㅂ':'ㅃ', 'ㅈ':'ㅉ', 'ㄷ':'ㄸ', 'ㄱ':'ㄲ', 'ㅅ':'ㅆ', 'ㅐ':'ㅒ', 'ㅔ':'ㅖ' } as Record<string, string>)[value] ?? value : value;
  return upper ? value.toLocaleUpperCase(language) : value;
}
export function replaceSelection(text: string, start: number, end: number, insert: string) {
  return { text: text.slice(0, start) + insert + text.slice(end), caret: start + insert.length };
}
export function deleteSelection(text: string, start: number, end: number) {
  if (start === end && start > 0) {
    // A grapheme may contain a surrogate pair or combining accents.
    const parts = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text.slice(0, start)));
    start = parts.at(-1)?.index ?? 0;
  }
  return replaceSelection(text, start, end, '');
}
