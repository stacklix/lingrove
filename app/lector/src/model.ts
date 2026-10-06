import { restoreSourceWhitespace } from './source-alignment';
import type { SentenceAnalysis } from './sentence-analysis';
export const MAX_LENGTH = 800;
export const MAX_ARTICLE_LENGTH = 20000;
export const languages = [
  { id: 'zh', name: '中文', hasRuby: false },
  { id: 'en', name: '英语', hasRuby: false },
  { id: 'ja', name: '日语', hasRuby: true },
  { id: 'ru', name: '俄语', hasRuby: false },
  { id: 'el', name: '希腊语', hasRuby: false },
] as const;
export type Language = (typeof languages)[number]['id'];
export const isLanguage = (value: unknown): value is Language =>
  languages.some((l) => l.id === value);
export const languageName = (value: Language) => languages.find((l) => l.id === value)!.name;
export interface RubyPart {
  text: string;
  reading: string;
}
export interface Token {
  text: string;
  kind: 'word' | 'separator';
  ruby: RubyPart[];
  lemma: string;
  reading: string;
  meaning: string;
  pos: string;
  role: string;
  grammar: string;
}
export interface Sentence {
  tokens: Token[];
  translation: string;
  explanation: string;
}
export interface Reading {
  language: Language;
  sentences: Sentence[];
}
export interface SavedReading {
  id: string;
  source: string;
  createdAt: number;
  reading: Reading;
  sentence: number;
  speechVoice?: string;
  tags?: string[];
  analyses?: Record<string, SentenceAnalysis>;
  title?: string;
  origin?: string;
  stats?: { opens: number; seconds: number; lookups: number; visited: number[]; lastRead: number };
}
export function validateInput(source: string): string {
  if (!source.trim()) throw new Error('请先输入一段文本。');
  if (source.length > MAX_LENGTH)
    throw new Error(`每次最多解析 ${MAX_LENGTH} 个字符，请将长文分段。`);
  return source;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('解析格式不完整，请重试。');
  return value as Record<string, unknown>;
}
function string(value: unknown, required = false): string {
  if (typeof value !== 'string' || value.length > 4000 || (required && !value.trim()))
    throw new Error('分析结果不完整，请重试。');
  return value;
}
export function validateReading(value: unknown, source: string): Reading {
  if (!source.trim() || source.length > MAX_ARTICLE_LENGTH) throw new Error('文章长度无效');
  const data = object(value);
  if (
    !isLanguage(data.language) ||
    !Array.isArray(data.sentences) ||
    !data.sentences.length ||
    data.sentences.length > MAX_ARTICLE_LENGTH
  )
    throw new Error('未能完成文章分析，请重试。');
  const sentences = data.sentences.map((raw): Sentence => {
    const s = object(raw);
    if (!Array.isArray(s.tokens) || !s.tokens.length || s.tokens.length > MAX_LENGTH)
      throw new Error('缺少注音片段。');
    const tokens = s.tokens.map((raw): Token => {
      const t = object(raw);
      const text = string(t.text);
      if (!text.length || !['word', 'separator'].includes(String(t.kind)))
        throw new Error('词语格式无效。');
      if (t.kind === 'separator') {
        if (!/^[\p{P}\p{Z}\p{S}\s]+$/u.test(text)) throw new Error('解析遗漏了词语解释，请重试。');
        return {
          text,
          kind: 'separator',
          ruby: [],
          lemma: '',
          reading: '',
          meaning: '',
          pos: '',
          role: '',
          grammar: '',
        };
      }
      if (!Array.isArray(t.ruby)) throw new Error('缺少假名注音数据。');
      const ruby = t.ruby.map((raw): RubyPart => {
        const part = object(raw);
        return { text: string(part.text, true), reading: string(part.reading) };
      });
      if (ruby.map((p) => p.text).join('') !== text) throw new Error('注音与原文不匹配，请重试。');
      if (
        ruby.some(
          (p) =>
            data.language === 'ja' &&
            !!p.reading &&
            /\p{Script=Han}/u.test(p.text) &&
            !/^[\p{Script=Hiragana}\p{Script=Katakana}ー・\s]+$/u.test(p.reading),
        )
      )
        throw new Error('汉字注音缺失或无效，请重试。');
      return {
        text,
        kind: 'word',
        ruby,
        lemma: string(t.lemma ?? ''),
        reading: string(t.reading ?? ''),
        meaning: string(t.meaning ?? ''),
        pos: string(t.pos ?? ''),
        role: string(t.role ?? ''),
        grammar: string(t.grammar ?? ''),
      };
    });
    return {
      tokens,
      translation: string(s.translation ?? ''),
      explanation: string(s.explanation ?? ''),
    };
  });
  if (!sentences.some((s) => s.tokens.some((t) => t.kind === 'word')))
    throw new Error('没有可阅读的词语，请输入文本。');
  return restoreSourceWhitespace({ language: data.language as Language, sentences }, source);
}
export function parseReading(raw: string, source: string): Reading {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '');
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    throw new Error('解析结果不完整，请缩短文本后重试。');
  }
  const record = object(data);
  if (typeof record.error === 'string') throw new Error(record.error.slice(0, 300));
  return validateReading(data, source);
}

export function parseTags(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[,，、\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}
