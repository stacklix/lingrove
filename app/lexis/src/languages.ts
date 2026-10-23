export type HandbookLanguage = 'ja' | 'el';

export const languages = [
  {
    id: 'ja' as const,
    name: '日语',
    nativeName: '日本語',
    placeholder: '例如：食べる、行く、高い',
    description: '输入日语单词，查看动词活用、形容词变化与例句。',
    scope: '动词 · い形容词 · な形容词',
  },
  {
    id: 'el' as const,
    name: '希腊语',
    nativeName: 'Ελληνικά',
    placeholder: '例如：γράφω、καλός、φίλος',
    description: '输入现代希腊语单词，查看动词的人称、数、时态，以及名词和形容词的性、数、格。',
    scope: '动词 · 名词 · 形容词 · 冠词 · 代词',
  },
];
