const toneMarks = /[\u0300\u0301\u0303\u0309\u0323]/g;
const tones: Record<string, string> = { s: '\u0301', f: '\u0300', r: '\u0309', x: '\u0303', j: '\u0323', z: '' };
const vowelFamilies: Record<string, string> = { a: 'aăâ', e: 'eê', i: 'i', o: 'oôơ', u: 'uư', y: 'y', d: 'dđ' };

function withoutTone(char: string) { return char.normalize('NFD').replace(toneMarks, '').normalize('NFC'); }
function toneOf(word: string) { return word.normalize('NFD').match(toneMarks)?.[0] ?? ''; }
function withTone(char: string, tone: string) { return (withoutTone(char).normalize('NFD') + tone).normalize('NFC'); }
function withBase(char: string, base: string) {
  return withTone(char === char.toLocaleUpperCase('vi') ? base.toLocaleUpperCase('vi') : base, toneOf(char));
}

/** Group variants by vowel shape and then tone, so every vowel fits in at most three rows. */
export function vietnameseVariants(key: string): string[] {
  const family = vowelFamilies[key.toLocaleLowerCase('vi')];
  if (!family) return [];
  const upper = key === key.toLocaleUpperCase('vi');
  return [...family].flatMap(base => (key.toLowerCase() === 'd' ? [''] : ['', ...Object.values(tones).filter(Boolean)])
    .map(tone => withTone(upper ? base.toLocaleUpperCase('vi') : base, tone)));
}

function vowelIndices(chars: string[]) {
  let indices = chars.flatMap((char, index) => /[aăâeêioôơuưy]/i.test(withoutTone(char)) ? [index] : []);
  // In qu-/gi-, u/i belongs to the onset when another vowel follows.
  if (indices.length > 1 && indices[0] === 1 && /^(qu|gi)/i.test(chars.map(withoutTone).join(''))) indices = indices.slice(1);
  return indices;
}

function placeTone(chars: string[], tone: string) {
  const indices = vowelIndices(chars);
  if (!indices.length) return chars;
  const shaped = indices.filter(index => /[ăâêôơư]/i.test(withoutTone(chars[index])));
  let target = indices[0];
  if (shaped.length) target = shaped.at(-1)!;
  else if (indices.length >= 3) target = indices[indices.length - 2];
  else if (indices.length === 2) {
    const pair = indices.map(index => withoutTone(chars[index]).toLowerCase()).join('');
    if (indices[1] < chars.length - 1 || ['oa', 'oe', 'uy'].includes(pair)) target = indices[1];
  }
  return chars.map((char, index) => withTone(char, index === target ? tone : ''));
}

function appendTelex(word: string, key: string, offset: number, raw: string[]) {
  const lower = key.toLowerCase();
  const chars = [...word];
  const currentTone = toneOf(word);
  const vowels = vowelIndices(chars);
  if (Object.hasOwn(tones, lower) && vowels.length) {
    const nextTone = tones[lower];
    if (nextTone !== currentTone) return placeTone(chars, nextTone).join('');
    // Repeating a modifier escapes it: ass → as. An unused z stays literal.
    return placeTone(chars, '').join('') + key;
  }
  if (lower === 'd' && /[dđ]/i.test(chars.at(-1) ?? '')) {
    const index = chars.length - 1;
    const repeated = chars[index].toLowerCase() === 'đ';
    chars[index] = withBase(chars[index], repeated ? 'd' : 'đ');
    return chars.join('') + (repeated ? key : '');
  }
  if (['a', 'e', 'o'].includes(lower)) {
    const index = vowels.at(-1);
    const base = index === undefined ? '' : withoutTone(chars[index]).toLowerCase();
    const target: Record<string, string> = { a: 'â', e: 'ê', o: 'ô' };
    if (index !== undefined && [lower, target[lower]].includes(base)) {
      const repeated = base === target[lower];
      chars[index] = withBase(chars[index], repeated ? lower : target[lower]);
      return placeTone(chars, currentTone).join('') + (repeated ? key : '');
    }
  }
  if (lower === 'w') {
    if (offset === 1 && raw[0].toLowerCase() === 'w') return raw[0];
    const eligible = vowels.filter(index => /[aăoơuư]/i.test(withoutTone(chars[index])));
    // uo can be followed by i/u: nguoiw → ngươi, ruouw → rươu.
    let pair = -1;
    eligible.forEach((index, position) => {
      if (position > 0 && eligible[position - 1] === index - 1
        && /[uư]/i.test(withoutTone(chars[index - 1])) && /[oơ]/i.test(withoutTone(chars[index]))
        && vowels.filter(vowel => vowel > index).every(vowel => /[iu]/i.test(withoutTone(chars[vowel])))) pair = position;
    });
    let index = pair >= 0 ? eligible[pair] : eligible.at(-1);
    // ua/uu take the horn on their first vowel: muaw → mưa, huuw → hưu.
    if (pair < 0 && vowels.length >= 2) {
      const first = vowels.at(-2)!;
      const last = vowels.at(-1)!;
      if (last === first + 1 && /[uư]/i.test(withoutTone(chars[first])) && /[au]/i.test(withoutTone(chars[last]))) index = first;
    }
    if (index !== undefined) {
      const base = withoutTone(chars[index]).toLowerCase();
      const previous = pair >= 0 ? eligible[pair - 1] : undefined;
      if (previous === index - 1 && /[uư]/i.test(withoutTone(chars[previous])) && /[oơ]/i.test(base)) {
        const repeated = withoutTone(chars[previous]).toLowerCase() === 'ư' && base === 'ơ';
        chars[previous] = withBase(chars[previous], repeated ? 'u' : 'ư');
        chars[index] = withBase(chars[index], repeated ? 'o' : 'ơ');
        return placeTone(chars, currentTone).join('') + (repeated ? key : '');
      }
      const shapes: Record<string, string> = { a: 'ă', o: 'ơ', u: 'ư', ă: 'a', ơ: 'o', ư: 'u' };
      const repeated = ['ă', 'ơ', 'ư'].includes(base);
      chars[index] = withBase(chars[index], shapes[base]);
      return placeTone(chars, currentTone).join('') + (repeated ? key : '');
    }
    if (!word) return key === 'W' ? 'Ư' : 'ư';
  }
  return placeTone([...chars, key], currentTone).join('');
}

/** Replay a single composing word; the caller keeps raw history for one-step deletion. */
export function composeVietnamese(input: string) {
  return [...input].reduce(appendTelex, '').normalize('NFC');
}
