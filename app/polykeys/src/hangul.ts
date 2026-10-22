const initials = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const vowels = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const finals = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const vowelPairs: Record<string, string> = { 'ㅗㅏ':'ㅘ', 'ㅗㅐ':'ㅙ', 'ㅗㅣ':'ㅚ', 'ㅜㅓ':'ㅝ', 'ㅜㅔ':'ㅞ', 'ㅜㅣ':'ㅟ', 'ㅡㅣ':'ㅢ' };
const finalPairs: Record<string, string> = { 'ㄱㅅ':'ㄳ', 'ㄴㅈ':'ㄵ', 'ㄴㅎ':'ㄶ', 'ㄹㄱ':'ㄺ', 'ㄹㅁ':'ㄻ', 'ㄹㅂ':'ㄼ', 'ㄹㅅ':'ㄽ', 'ㄹㅌ':'ㄾ', 'ㄹㅍ':'ㄿ', 'ㄹㅎ':'ㅀ', 'ㅂㅅ':'ㅄ' };
function syllable(initial: number, vowel: number, final = 0) {
  return String.fromCharCode(0xac00 + (initial * 21 + vowel) * 28 + final);
}
/** Append one two-set key, composing only the caller's active input segment. */
export function appendHangul(input: string, key: string): string {
  const last = input.at(-1) ?? '';
  const prefix = input.slice(0, -1);
  const vowel = vowels.indexOf(key);
  const initial = initials.indexOf(last);
  if (initial >= 0 && vowel >= 0) return prefix + syllable(initial, vowel);
  if (vowelPairs[last + key]) return prefix + vowelPairs[last + key];
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code >= 11172 || !Number.isFinite(code)) return input + key;
  const l = Math.floor(code / 588), v = Math.floor(code % 588 / 28), f = code % 28;
  if (vowel >= 0) {
    if (!f) {
      const combined = vowelPairs[vowels[v] + key];
      return combined ? prefix + syllable(l, vowels.indexOf(combined)) : input + key;
    }
    const pair = Object.entries(finalPairs).find(([, result]) => result === finals[f])?.[0];
    const retained = pair ? finals.indexOf(pair[0]) : 0;
    const moved = pair ? pair[1] : finals[f];
    return prefix + syllable(l, v, retained) + syllable(initials.indexOf(moved), vowel);
  }
  const nextFinal = !f ? finals.indexOf(key) : finals.indexOf(finalPairs[finals[f] + key]);
  return nextFinal > 0 ? prefix + syllable(l, v, nextFinal) : input + key;
}
export function isHangulKey(value: string) { return initials.includes(value) || vowels.includes(value); }
