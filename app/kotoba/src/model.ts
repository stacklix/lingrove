import type { HandbookLanguage } from './languages';
export interface InflectionGroup {
  label: string;
  word: string;
  reading: string;
  usage: string;
}
export interface Form {
  group: string;
  label: string;
  word: string;
  reading: string;
  usage: string;
  example: string;
  exampleReading: string;
  translation: string;
}
export interface Entry {
  word: string;
  reading: string;
  meaning: string;
  type: string;
  note: string;
  inflectable: boolean;
  groups: InflectionGroup[];
  forms: Form[];
}
const invalid = (detail: string) =>
  new Error('变形结果未完整生成，请重新查询。', { cause: detail });
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid('缺少资料对象');
  return value as Record<string, unknown>;
}
function required(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw invalid(`缺少${field}`);
  return value.trim();
}
function optional(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
export function parseEntry(raw: string): Entry {
  let value: unknown;
  try {
    value = JSON.parse(
      raw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, ''),
    );
  } catch {
    throw invalid('JSON 未完整返回或无法解析');
  }
  const v = object(value);
  if (typeof v.error === 'string' && v.error.trim()) throw new Error(v.error);
  const sourceGroups = v.groups;
  if (!Array.isArray(sourceGroups) || !sourceGroups.length || sourceGroups.length > 16)
    throw invalid('缺少变形分组');
  const names = new Set<string>();
  const groups = sourceGroups.map((item) => {
    const group = object(item);
    const label = required(group.label, '分组名称');
    if (names.has(label)) throw invalid(`重复分组：${label}`);
    names.add(label);
    return {
      label,
      word: required(group.word, `${label}词形`),
      reading: optional(group.reading),
      usage: optional(group.usage),
    };
  });
  const source = v.forms;
  if (!Array.isArray(source) || !source.length || source.length > 120)
    throw invalid('缺少变形条目');
  const labels = new Set<string>();
  const forms = source.map((item) => {
    const form = object(item);
    const group = required(form.group, '所属分组');
    if (!names.has(group)) throw invalid(`找不到对应分组：${group || '未指定'}`);
    const label = required(form.label, '形式名称');
    const key = `${group}:${label}`;
    if (labels.has(key)) throw invalid(`重复条目：${label}`);
    labels.add(key);
    return {
      group,
      label,
      word: required(form.word, `${label}词形`),
      reading: optional(form.reading),
      usage: optional(form.usage),
      example: required(form.example, `${label}例句`),
      exampleReading: optional(form.exampleReading),
      translation: required(form.translation, `${label}例句翻译`),
    };
  });
  if (typeof v.inflectable !== 'boolean') throw invalid('活用标记无效');
  return {
    word: required(v.word, '单词'),
    reading: optional(v.reading),
    meaning: required(v.meaning, '释义'),
    type: required(v.type, '词性'),
    note: optional(v.note),
    inflectable: v.inflectable,
    groups,
    forms,
  };
}

// Only expose complete JSON objects; never fabricate a truncated example or persist previews.
export function partialEntry(raw: string): Entry | null {
  const source = raw.trim().replace(/^```(?:json)?\s*/i, '');
  const match = /"forms"\s*:\s*\[/.exec(source);
  if (!match) return null;
  let depth = 0,
    quoted = false,
    escaped = false,
    end = -1;
  for (let i = match.index + match[0].length; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      if (--depth === 0) end = i + 1;
    } else if (c === ']' && depth === 0) break;
  }
  if (end < 0) return null;
  try {
    return parseEntry(source.slice(0, end) + ']}');
  } catch {
    return null;
  }
}
export function validateInput(text: string, language: HandbookLanguage = 'ja'): string {
  const word = text.trim().normalize('NFC');
  if (!word) throw new Error('请先输入一个单词。');
  if (word.length > 40 || /[\r\n。！？!?;；.·]/u.test(word))
    throw new Error('请输入一个单词，最多 40 个字符，不要输入整句。');
  if (language === 'ja' && !/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(word))
    throw new Error('请使用日语汉字或假名输入，例如「食べる」。');
  if (language === 'el' && !/^[\p{Script=Greek}\p{M}]+$/u.test(word))
    throw new Error('请使用希腊字母输入，例如「γράφω」或「καλός」。');
  return word;
}
