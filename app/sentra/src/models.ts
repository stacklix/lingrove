export type Action = 'translate' | 'grammar' | 'improve';
export const actions: { id: Action; label: string }[] = [
  { id: 'translate', label: '翻译' },
  { id: 'grammar', label: '语法' },
  { id: 'improve', label: '更地道' },
];
export const languages = ['英语', '日语', '俄语', '希腊语'];
export interface Settings {
  translationLanguage: string;
  level: string;
}
export const defaults: Settings = {
  translationLanguage: '英语',
  level: '中级',
};
export interface Result {
  action: Action;
  data: Record<string, any>;
  model: string;
  createdAt: string;
  schemaVersion: number;
  language?: string;
}
export interface Sentence {
  id: string;
  text: string;
  translationLanguage: string;
  explanationLanguage: string;
  level: string;
  createdAt: string;
  results: Result[];
  learningVersion: number;
}
const languageCode = (s: string) =>
  ({
    英语: 'en',
    english: 'en',
    en: 'en',
    日语: 'ja',
    japanese: 'ja',
    日本語: 'ja',
    'ja-jp': 'ja',
    ja: 'ja',
    俄语: 'ru',
    russian: 'ru',
    ru: 'ru',
    希腊语: 'el',
    greek: 'el',
    el: 'el',
  })[s.toLowerCase()] ?? s.toLowerCase();
export function isSentenceComponent(text: unknown): boolean {
  return typeof text === 'string' && /\S/u.test(text) && !/^[\p{P}\s]+$/u.test(text);
}
export function validateResult(
  action: Action,
  content: string,
  text: string,
  target: string,
): Record<string, any> {
  let d;
  try {
    d = JSON.parse(
      content
        .trim()
        .replace(/^```(?:json)?\s*/, '')
        .replace(/\s*```$/, ''),
    );
  } catch (cause) {
    throw new Error('生成结果不完整，请重试。', { cause });
  }
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('生成结果不完整，请重试。');
  const str = (o: any, k: string) => {
    if (typeof o?.[k] !== 'string' || !o[k].trim()) throw new Error('生成结果不完整，请重试。');
  };
  const list = (o: any, k: string) => {
    if (!Array.isArray(o[k]) || o[k].some((s: unknown) => typeof s !== 'string'))
      throw new Error('生成结果不完整，请重试。');
  };
  const objects = (key: string, fields: string[], nonempty = false) => {
    if (!Array.isArray(d[key]) || (nonempty && !d[key].length))
      throw new Error('生成结果不完整，请重试。');
    for (const item of d[key]) for (const field of fields) str(item, field);
  };
  str(d, 'source_language');
  if (action === 'translate') {
    str(d, 'translation_language');
    objects('translations', ['text', 'type'], true);
    list(d, 'notes');
    if (
      d.translations.length !== 2 ||
      d.translations[0].type !== 'direct' ||
      d.translations[1].type !== 'natural' ||
      languageCode(d.translation_language) !== languageCode(target)
    )
      throw new Error('模型未按目标语言返回直译和地道表达');
  } else {
    const prefix = action === 'grammar' ? 'analysis' : 'reference';
    if (d[`${prefix}_origin`] !== 'original' || d[`${prefix}_text`]?.trim() !== text.trim())
      throw new Error('模型更改了待分析原句，请重试');
    if (action === 'grammar') {
      if (typeof d.correct !== 'boolean') throw new Error('缺少语法判断');
      str(d, 'summary');
      objects('corrections', ['original', 'corrected', 'explanation'], !d.correct);
      if (d.correct && d.corrections.length) throw new Error('语法判断与纠错矛盾');
      objects('structure', ['text', 'part', 'role'], true);
      d.structure = d.structure.filter((item: { text: string }) => isSentenceComponent(item.text));
      for (const item of d.structure) str(item, 'translation');
      objects('grammar_points', ['title', 'explanation']);
      for (const point of d.grammar_points) list(point, 'inflections');
    } else {
      str(d, 'naturalness');
      objects('alternatives', ['text', 'style', 'translation', 'explanation'], true);
    }
  }
  const japanese = languageCode(action === 'translate' ? target : d.source_language) === 'ja';
  if (japanese) {
    const reading = (item: any, field: string) => {
      // Grammar readings supplement the analysis; omissions must not discard it.
      if (
        action === 'grammar' &&
        (item[field] == null ||
          item[field] === '' ||
          (typeof item[field] === 'string' && !item[field].trim()))
      ) {
        delete item[field];
        return;
      }
      str(item, field);
      if (/[\p{Script=Han}a-zA-Z0-9]/u.test(item[field]))
        throw new Error('模型未返回有效的日语假名，请重试');
    };
    if (action === 'grammar') {
      reading(d, 'analysis_reading');
      for (const item of d.corrections) reading(item, 'corrected_reading');
      for (const item of d.structure) reading(item, 'reading');
    } else {
      for (const item of d[action === 'translate' ? 'translations' : 'alternatives'])
        reading(item, 'reading');
    }
  }
  return d;
}
