const kana: Record<string, string> = {};
for (const [prefix, letters] of Object.entries({
  '': 'あいうえお', k: 'かきくけこ', g: 'がぎぐげご', s: 'さしすせそ', z: 'ざじずぜぞ',
  t: 'たちつてと', d: 'だぢづでど', n: 'なにぬねの', h: 'はひふへほ', b: 'ばびぶべぼ',
  p: 'ぱぴぷぺぽ', m: 'まみむめも', r: 'らりるれろ',
})) [...letters].forEach((letter, index) => { kana[prefix + 'aiueo'[index]] = letter; });
Object.assign(kana, { ya: 'や', yu: 'ゆ', yo: 'よ', wa: 'わ', wo: 'を', wi: 'うぃ', we: 'うぇ',
  shi: 'し', chi: 'ち', tsu: 'つ', fu: 'ふ', ji: 'じ', she: 'しぇ', che: 'ちぇ', je: 'じぇ',
  fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
  xtu: 'っ', xtsu: 'っ', ltu: 'っ', ltsu: 'っ', xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', lya: 'ゃ', lyu: 'ゅ', lyo: 'ょ',
  xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ', la: 'ぁ', li: 'ぃ', lu: 'ぅ', le: 'ぇ', lo: 'ぉ',
});
for (const [prefix, base] of Object.entries({ ky: 'き', gy: 'ぎ', sh: 'し', sy: 'し', j: 'じ', jy: 'じ', zy: 'じ', ch: 'ち', ty: 'ち', cy: 'ち', dy: 'ぢ', ny: 'に', hy: 'ひ', by: 'び', py: 'ぴ', my: 'み', ry: 'り' })) {
  for (const [vowel, small] of Object.entries({ a: 'ゃ', u: 'ゅ', o: 'ょ' })) kana[prefix + vowel] = base + small;
}

export function toKatakana(value: string) {
  return value.replace(/[ぁ-ゖ]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60));
}

/** Keep incomplete romaji visible until more input or an explicit commit. */
export function composeJapanese(input: string, katakana = false, finalize = false) {
  let output = '', rest = input.toLowerCase();
  while (rest) {
    if (rest.startsWith("n'")) { output += 'ん'; rest = rest.slice(2); continue; }
    if (rest.startsWith('tch')) { output += 'っ'; rest = rest.slice(1); continue; }
    if (rest.startsWith('nn')) {
      output += 'ん'; rest = rest.slice(rest.length > 2 && /[aiueoy]/.test(rest[2]) ? 1 : 2); continue;
    }
    if (rest[0] === 'n' && ((rest.length > 1 && !/[aiueoy]/.test(rest[1])) || (finalize && rest.length === 1))) {
      output += 'ん'; rest = rest.slice(1); continue;
    }
    if (/^([bcdfghjkmprstvwxyz])\1/.test(rest)) { output += 'っ'; rest = rest.slice(1); continue; }
    const match = Object.keys(kana).sort((a, b) => b.length - a.length).find(key => rest.startsWith(key));
    if (match) { output += kana[match]; rest = rest.slice(match.length); continue; }
    if (!finalize && Object.keys(kana).some(key => key.startsWith(rest))) { output += rest; break; }
    output += rest[0]; rest = rest.slice(1);
  }
  return katakana ? toKatakana(output) : output;
}
