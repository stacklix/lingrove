export interface SchoolForm {
  label: string;
  word: string;
  reading: string;
  usage: string;
}
export interface Form {
  schoolForm: string;
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
  schoolForms: SchoolForm[];
  forms: Form[];
}
const invalid = (detail: string) => new Error(`活用结果格式有误：${detail}。请重新查询。`);
const groupAliases: Record<string, string> = {
  連用形: '连用形',
  終止形: '终止形',
  連体形: '连体形',
  仮定形: '假定形',
  派生表現: '派生表达',
  無活用: '无活用',
};
function groupName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : '';
  return groupAliases[name] ?? name;
}
function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid('缺少资料对象');
  return value as Record<string, any>;
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
  const school = v.schoolForms ?? v.school_forms;
  if (!Array.isArray(school) || !school.length || school.length > 8)
    throw invalid('缺少学校文法分组');
  const names = new Set<string>();
  const allowed = [
    '未然形',
    '连用形',
    '终止形',
    '连体形',
    '假定形',
    '命令形',
    '派生表达',
    '无活用',
  ];
  const schoolForms = school.map((item) => {
    const group = object(item);
    const label = groupName(group.label);
    if (!allowed.includes(label) || names.has(label)) throw invalid(`学校文法分组无效：${label}`);
    names.add(label);
    return {
      label,
      word: required(group.word, `${label}词形`),
      reading: optional(group.reading),
      usage: optional(group.usage),
    };
  });
  // Accept nested educational forms as well as the flat wire format.
  const source =
    v.forms ??
    school.flatMap((group) =>
      Array.isArray(group.forms)
        ? group.forms.map((form: unknown) => ({ ...object(form), schoolForm: group.label }))
        : [],
    );
  if (!Array.isArray(source) || !source.length || source.length > 32)
    throw invalid('缺少教育文法条目');
  const labels = new Set<string>();
  const forms = source.map((item) => {
    const form = object(item);
    const schoolForm = groupName(form.schoolForm ?? form.school_form);
    if (!names.has(schoolForm)) throw invalid(`找不到对应分组：${schoolForm || '未指定'}`);
    const label = required(form.label, '形式名称');
    const key = `${schoolForm}:${label}`;
    if (labels.has(key)) throw invalid(`重复条目：${label}`);
    labels.add(key);
    return {
      schoolForm,
      label,
      word: required(form.word, `${label}词形`),
      reading: optional(form.reading),
      usage: optional(form.usage),
      example: required(form.example, `${label}例句`),
      exampleReading: optional(form.exampleReading ?? form.example_reading),
      translation: required(form.translation, `${label}例句翻译`),
    };
  });
  if (v.inflectable !== undefined && typeof v.inflectable !== 'boolean')
    throw invalid('活用标记无效');
  const missingReadings =
    schoolForms.some((g) => !g.reading) || forms.some((f) => !f.reading || !f.exampleReading);
  return {
    word: required(v.word, '单词'),
    reading: optional(v.reading),
    meaning: required(v.meaning, '释义'),
    type: required(v.type, '词性'),
    note: [optional(v.note), missingReadings ? '部分读音未返回，已保留活用与例句。' : '']
      .filter(Boolean)
      .join(' '),
    inflectable: v.inflectable ?? !names.has('无活用'),
    schoolForms,
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
export function validateInput(text: string): string {
  const word = text.trim();
  if (!word) throw new Error('请先输入一个日语单词。');
  if (word.length > 40 || /[\r\n。！？!?]/u.test(word))
    throw new Error('请输入一个单词，最多 40 个字符，不要输入整句。');
  if (!/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(word))
    throw new Error('请使用日语汉字或假名输入，例如「食べる」。');
  return word;
}
