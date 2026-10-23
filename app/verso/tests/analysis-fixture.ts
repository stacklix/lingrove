import { demoSource } from '../src/demo';
import type { SentenceAnalysis } from '../src/sentence-analysis';
export const analysis: SentenceAnalysis = {
  version: 1,
  language: 'zh-Hans',
  analysis_text: demoSource,
  translation: '我昨天在图书馆读了书。',
  correct: true,
  summary: '话题＋时间＋地点＋宾语＋谓语。',
  corrections: [],
  structure: [
    { text: '私は', translation: '我', part: '代词＋助词', role: '提出本句话题。' },
    { text: '昨日', translation: '昨天', part: '时间名词', role: '时间状语。' },
    { text: '図書館で', translation: '在图书馆', part: '名词＋格助词', role: '动作发生的地点。' },
    { text: '本を', translation: '书', part: '名词＋格助词', role: '阅读的对象。' },
    { text: '読みました', translation: '读了', part: '动词＋助动词', role: '本句谓语。' },
  ],
  grammar_points: [
    {
      title: '礼貌体过去式',
      explanation: '「ました」表示礼貌体过去。',
      inflections: ['読む', '読み', '読みました'],
    },
  ],
};
