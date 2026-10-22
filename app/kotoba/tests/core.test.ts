import { describe, expect, it, vi } from 'vitest';
import { demo } from '../src/demo';
import { greekDemos } from '../src/greek-demos';
import { greekTopics } from '../src/greek';
import messages from '../src/locales/messages.json';
import { parseEntry, partialEntry, validateInput } from '../src/model';
vi.mock('@lingrove/host-sdk', () => ({
  llm: { complete: vi.fn() },
  getAppLanguage: vi.fn().mockResolvedValue('en'),
}));
import { llm } from '@lingrove/host-sdk';
import { lookup } from '../src/api';
describe('query validation and response boundaries', () => {
  it('accepts kana, kanji and normalizes surrounding whitespace', () => {
    for (const word of ['食べる', '行く', '高い', '静か', 'する', '来る', 'いい', 'コーヒー'])
      expect(validateInput(` ${word} `)).toBe(word);
  });
  it('rejects empty input, Latin-only input, sentences and oversized input', () => {
    for (const word of ['', '  ', 'eat', '食べる。', '行く\n来る', 'あ'.repeat(41)])
      expect(() => validateInput(word)).toThrow();
  });
  it('accepts complete entries and fenced JSON', () => {
    expect(parseEntry('```json\n' + JSON.stringify(demo) + '\n```')).toEqual(demo);
    expect(demo.forms).toHaveLength(15);
  });
  it('rejects malformed, missing, duplicate and empty results', () => {
    for (const data of [
      null,
      {},
      { ...demo, forms: [] },
      { ...demo, inflectable: 'yes' },
      { ...demo, forms: [demo.forms[0], demo.forms[0]] },
      { ...demo, forms: [{ ...demo.forms[0], example: '' }] },
    ])
      expect(() => parseEntry(JSON.stringify(data))).toThrow();
    expect(() => parseEntry('not json')).toThrow();
  });
  it('allows non-inflecting words with an original-form example', () => {
    expect(
      parseEntry(JSON.stringify({ ...demo, inflectable: false, forms: [demo.forms[0]] }))
        .inflectable,
    ).toBe(false);
  });
  it('passes cancellation and isolated word data to the model', async () => {
    vi.mocked(llm.complete).mockResolvedValue({ text: JSON.stringify(demo), model: 'test' });
    const signal = new AbortController().signal;
    expect(await lookup(' 食べる ', signal)).toEqual(demo);
    expect(llm.complete).toHaveBeenLastCalledWith(
      expect.objectContaining({ messages: [{ role: 'user', content: '{"word":"食べる"}' }] }),
      { signal, onStatus: undefined, onProgress: undefined },
    );
  });
  it('surfaces unrecognized-word errors', async () => {
    vi.mocked(llm.complete).mockResolvedValue({
      text: '{"error":"无法识别这个单词"}',
      model: 'test',
    });
    await expect(lookup('ああああ', new AbortController().signal)).rejects.toThrow('无法识别');
  });
});

it('rejects missing school grammar or educational forms without a matching parent', () => {
  expect(() => parseEntry(JSON.stringify({ ...demo, groups: [] }))).toThrow();
  expect(() =>
    parseEntry(JSON.stringify({ ...demo, forms: [{ ...demo.forms[0], group: '不存在' }] })),
  ).toThrow();
});

it('allows optional readings without inventing them for Greek', () => {
  const value = JSON.parse(JSON.stringify(greekDemos[1]));
  delete value.note;
  delete value.forms[0].exampleReading;
  const parsed = parseEntry(JSON.stringify(value));
  expect(parsed.forms[0].exampleReading).toBe('');
  expect(parsed.note).toBe('');
  expect(parsed.groups).toHaveLength(6);
});
it('shows complete streamed rows without exposing the trailing incomplete row', () => {
  const full = JSON.stringify(demo);
  const split = full.indexOf(JSON.stringify(demo.forms[1]));
  const partial = partialEntry(full.slice(0, split + 20));
  expect(partial?.forms).toHaveLength(1);
  expect(partial?.forms[0]).toEqual(demo.forms[0]);
  expect(partialEntry(full.slice(0, 80))).toBeNull();
});
it('handles a fenced model error without replacing it with a generic format error', () => {
  expect(() => parseEntry('```json\n{"error":"无法识别这个词"}\n```')).toThrow('无法识别这个词');
});

it('validates Greek input independently, including decomposed accents', () => {
  expect(validateInput(' γράφω ', 'el')).toBe('γράφω');
  for (const word of ['καλός', 'φίλου', 'έγραψα', 'η'])
    expect(validateInput(word, 'el')).toBe(word);
  for (const word of ['食べる', 'grapho', 'γράφω σπίτι', 'γράφω;', 'γράφω?', 'γράφω\nκαλός']) {
    expect(() => validateInput(word, 'el')).toThrow();
  }
  expect(() => validateInput('γράφω', 'ja')).toThrow();
});

it('routes Greek queries to a Modern Greek prompt and streams the generic schema', async () => {
  const value = greekDemos[1];
  vi.mocked(llm.complete).mockImplementationOnce(async (request, options) => {
    expect(request.system).toContain('MODERN Greek');
    expect(request.system).toContain('Use en for meanings');
    expect(request.system).toContain('SIX groups');
    options?.onProgress?.(JSON.stringify(value));
    return { text: JSON.stringify(value), model: 'test' };
  });
  const progress = vi.fn();
  expect(await lookup('καλός', new AbortController().signal, progress, undefined, 'el')).toEqual(
    value,
  );
  expect(progress).toHaveBeenCalledWith(value, expect.any(Number));
});

it('ships full Greek adjective and noun cases, plus all six verb persons', () => {
  for (const entry of greekDemos) expect(parseEntry(JSON.stringify(entry))).toEqual(entry);
  expect(greekDemos[1].forms).toHaveLength(24);
  expect(greekDemos[2].forms).toHaveLength(8);
  for (const group of greekDemos[1].groups) {
    expect(greekDemos[1].forms.filter((f) => f.group === group.label).map((f) => f.label)).toEqual([
      '主格',
      '属格',
      '宾格',
      '呼格',
    ]);
  }
  expect(greekDemos[0].forms.filter((f) => f.group === '现在时')).toHaveLength(6);
  expect(greekDemos[1].forms.find((f) => f.group === '阳性复数' && f.label === '宾格')?.word).toBe(
    'καλούς',
  );
  expect(greekDemos[2].forms.find((f) => f.group === '复数' && f.label === '属格')?.word).toBe(
    'των φίλων',
  );
});

it('localizes all Greek lessons and offline explanations in English and Japanese', () => {
  const text: string[] = [];
  for (const topic of greekTopics) {
    text.push(topic.title, topic.intro, topic.note);
    for (const rule of topic.rules) text.push(rule.name, rule.rule, rule.translation);
    text.push(...(topic.table?.columns ?? []), ...(topic.table?.rows.flat() ?? []));
  }
  for (const entry of greekDemos) {
    text.push(entry.meaning, entry.type, entry.note);
    for (const group of entry.groups) text.push(group.label, group.usage);
    for (const form of entry.forms) text.push(form.label, form.usage, form.translation);
  }
  const catalog = messages as Record<string, { en: string; ja: string }>;
  for (const value of text.filter((s) => /[\p{Script=Han}]/u.test(s))) {
    expect(catalog[value]?.en, value).toBeTruthy();
    expect(catalog[value]?.ja, value).toBeTruthy();
  }
});
