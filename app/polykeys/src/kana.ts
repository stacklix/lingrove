import { toKatakana } from './japanese';

// Center, left, up, right, down: the standard Japanese 12-key arrangement.
export const kanaGroups = [
  'あいうえお', 'かきくけこ', 'さしすせそ',
  'たちつてと', 'なにぬねの', 'はひふへほ',
  'まみむめも', 'や ゆ よ', 'らりるれろ',
  'わをんー〜', '、。？！・',
];
export function flickIndex(dx: number, dy: number) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return 0;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 3) : (dy < 0 ? 2 : 4);
}
export function kanaVariant(char: string) {
  const cycles = ['かが', 'きぎ', 'くぐ', 'けげ', 'こご', 'さざ', 'しじ', 'すず', 'せぜ', 'そぞ',
    'ただ', 'ちぢ', 'つづっ', 'てで', 'とど', 'はばぱ', 'ひびぴ', 'ふぶぷ', 'へべぺ', 'ほぼぽ',
    'あぁ', 'いぃ', 'うゔぅ', 'えぇ', 'おぉ', 'やゃ', 'ゆゅ', 'よょ', 'わゎ'];
  const isKatakana = /[ァ-ヶ]/.test(char);
  const hiragana = isKatakana ? String.fromCharCode(char.charCodeAt(0) - 0x60) : char;
  const cycle = cycles.find(item => item.includes(hiragana));
  if (!cycle) return char;
  const result = cycle[(cycle.indexOf(hiragana) + 1) % cycle.length];
  return isKatakana ? toKatakana(result) : result;
}
