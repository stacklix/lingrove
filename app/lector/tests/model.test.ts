import { describe, expect, it } from 'vitest';
import { demo, demoSource } from '../src/demo';
import { parseReading, validateInput, validateReading } from '../src/model';
const copy = () => structuredClone(demo);
describe('lossless reading contract', () => {
  it('accepts contextual particles and inflected words with separate okurigana', () => {
    expect(parseReading('```json\n' + JSON.stringify(demo) + '\n```', demoSource)).toEqual(demo);
    expect(demo.sentences[0].tokens[1].reading).toBe('わ');
    expect(demo.sentences[0].tokens[8].ruby).toEqual([
      { text: '読', reading: 'よ' },
      { text: 'みました', reading: '' },
    ]);
  });
  it('preserves paragraph whitespace exactly', () => {
    const data = copy();
    data.sentences[0].tokens.push({ ...data.sentences[0].tokens[3], text: '\n  ' });
    data.sentences.push(...copy().sentences);
    expect(validateReading(data, demoSource + '\n  ' + demoSource).sentences).toHaveLength(2);
    expect(
      validateReading(data, demoSource + demoSource)
        .sentences.flatMap((sentence) => sentence.tokens)
        .map((token) => token.text)
        .join(''),
    ).toBe(demoSource + demoSource);
  });
  it('rejects rewritten, omitted, or reordered text', () => {
    expect(() => validateReading(demo, demoSource.replace('昨日', '今日'))).toThrow('原文');
    const data = copy();
    data.sentences[0].tokens.pop();
    expect(() => validateReading(data, demoSource)).toThrow('原文');
  });
  it('rejects mismatched ruby and missing contextual information', () => {
    const data = copy();
    data.sentences[0].tokens[0].ruby[0].text = '彼';
    expect(() => validateReading(data, demoSource)).toThrow('注音');
    const noReading = copy();
    noReading.sentences[0].tokens[0].ruby[0].reading = '';
    expect(() => validateReading(noReading, demoSource)).toThrow('注音');
    const noRole = copy();
    noRole.sentences[0].tokens[1].role = '';
    expect(validateReading(noRole, demoSource).sentences[0].tokens[1].role).toBe('');
  });
  it('does not allow words to be hidden in separators', () => {
    const data = copy();
    data.sentences[0].tokens[0].kind = 'separator';
    expect(() => validateReading(data, demoSource)).toThrow('遗漏');
  });
  it('handles unsupported language, refusal, truncation, and input bounds', () => {
    expect(() => validateReading({ ...demo, language: 'en' }, demoSource)).toThrow('语言');
    expect(() => parseReading('{"error":"请提供日语文本。"}', 'abc')).toThrow('请提供日语');
    expect(() => parseReading('{"sentences":', demoSource)).toThrow('不完整');
    expect(() => validateInput(' \n ')).toThrow('输入');
    expect(() => validateInput('あ'.repeat(801))).toThrow('800');
  });
});
