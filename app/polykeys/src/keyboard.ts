export interface Layout { id: string; name: string; rows: string[]; extra: string; }
const qwerty = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
export const layouts: Layout[] = [
  { id: 'ko', name: '韩语', rows: ['ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ', 'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ', 'ㅋㅌㅊㅍㅠㅜㅡ'], extra: '' },
  { id: 'en', name: '英语', rows: qwerty, extra: '' },
  { id: 'fr', name: '法语', rows: ['azertyuiop', 'qsdfghjklm', 'wxcvbn'], extra: 'àâæçéèêëîïôœùûüÿ' },
  { id: 'de', name: '德语', rows: ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm'], extra: 'ß' },
  { id: 'es', name: '西班牙语', rows: ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'], extra: 'áéíóúü¿¡' },
  { id: 'pt', name: '葡萄牙语', rows: qwerty, extra: 'áàâãçéêíóôõúü' },
  { id: 'it', name: '意大利语', rows: qwerty, extra: 'àèéìíîòóùú' },
  { id: 'tr', name: '土耳其语', rows: ['qwertyuıopğü', 'asdfghjklşi', 'zxcvbnmöç'], extra: 'âîû' },
  { id: 'ru', name: '俄语', rows: ['йцукенгшщзх', 'фывапролджэ', 'ячсмитьбю'], extra: 'ёъ' },
  { id: 'uk', name: '乌克兰语', rows: ['йцукенгшщзх', 'фівапролджє', 'ячсмитьбю'], extra: 'ґї’' },
  { id: 'el', name: '希腊语', rows: ['ςερτυθιοπ', 'ασδφγηξκλ', 'ζχψωβνμ'], extra: 'άέήίόύώϊϋΐΰ' },
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
