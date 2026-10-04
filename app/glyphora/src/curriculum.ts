import kana from './kana.json';
export type Language = 'ja' | 'ru' | 'el';
export type Group = 'hiragana' | 'katakana' | 'lower' | 'upper' | 'mixed';
export interface Glyph {
  id: string;
  text: string;
  language: Language;
  group: Group;
  name: string;
  hint: string;
  paths?: string[];
}
export const languages = [
  { id: 'ja' as const, name: '日语', subtitle: '从五十音开始', sample: 'あ' },
  { id: 'ru' as const, name: '俄语', subtitle: '认识流畅的手写体', sample: 'д' },
  { id: 'el' as const, name: '希腊语', subtitle: '写下新的字母', sample: 'α' },
];
const hiragana =
  'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const readings =
  'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n'.split(
    ' ',
  );
const russian = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const greek = 'αβγδεζηθικλμνξοπρστυφχψω';
const greekNames =
  'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega'.split(
    ' ',
  );
const russianHints: Record<string, string> = {
  д: '注意手写体的环形与下伸部分，不要照抄印刷体。',
  т: '当前范字采用短横加下行笔的写法；拱形连笔也是常见变体。',
  п: '留意起笔与拱形，不要与 т、и 混淆。',
  и: '留意两侧笔画与中间连接的走向。',
  ш: '数清连续起伏，注意与 и、щ 的区别。',
  щ: '末端有下伸部分，注意与 ш 区分。',
  й: '上方短弧是字母的一部分，不要漏写。',
  ё: '上方两点是字母的一部分，不要漏写。',
  ь: '留意竖画与下方的环形。',
  ы: '注意两部分的间距与比例。',
};
export const glyphs: Glyph[] = [
  ...[...hiragana].flatMap((c, i) =>
    [c, String.fromCharCode(c.charCodeAt(0) + 0x60)].map((text, j) => ({
      id: `ja-${text}`,
      text,
      language: 'ja' as const,
      group: (j ? 'katakana' : 'hiragana') as Group,
      name: readings[i],
      hint: '观察笔画的先后、方向与位置，再独立书写。',
      paths: (kana as Record<string, string[]>)[text],
    })),
  ),
  ...[...russian].flatMap((c) =>
    [c, c.toUpperCase()].map((text, i) => ({
      id: `ru-${text}`,
      text,
      language: 'ru' as const,
      group: (i ? 'upper' : 'lower') as Group,
      name: `${c.toUpperCase()} · ${c}`,
      hint: russianHints[c] || '对照手写范字，留意转折、连接与整体比例。',
    })),
  ),
  ...[...greek, 'ς'].flatMap((c, i) =>
    (c === 'ς' ? [c] : [c, c.toUpperCase()]).map((text, j) => ({
      id: `el-${text}`,
      text,
      language: 'el' as const,
      group: (j ? 'upper' : 'lower') as Group,
      name: c === 'ς' ? 'sigma · 词尾形式' : greekNames[i],
      hint:
        c === 'ς' ? 'ς 是小写 sigma 位于词尾时的形式。' : '观察手写字形的弧线、开口与上下伸展。',
    })),
  ),
];
export const groups = (language: Language): { id: Group; name: string }[] =>
  language === 'ja'
    ? [
        { id: 'hiragana', name: '平假名' },
        { id: 'katakana', name: '片假名' },
      ]
    : [
        { id: 'lower', name: '小写' },
        { id: 'upper', name: '大写' },
        { id: 'mixed', name: '大小写混合' },
      ];
export const poolFor = (language: Language, group: Group) =>
  glyphs.filter((g) => g.language === language && (group === 'mixed' || g.group === group));
export const fontFor = (g: Glyph) => (g.language === 'ru' ? 'Bad Script' : 'Playpen Sans');
