import { describe, expect, it, vi } from 'vitest';
import { demo } from '../src/demo';
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
      { signal, onProgress: undefined },
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
  expect(() => parseEntry(JSON.stringify({ ...demo, schoolForms: [] }))).toThrow();
  expect(() =>
    parseEntry(JSON.stringify({ ...demo, forms: [{ ...demo.forms[0], schoolForm: '不存在' }] })),
  ).toThrow();
});

it('normalizes Japanese group labels, snake-case fields, and missing optional readings', () => {
  const value = JSON.parse(JSON.stringify(demo));
  value.schoolForms[1].label = '連用形';
  for (const form of value.forms) {
    if (form.schoolForm === '连用形') form.schoolForm = '連用形';
  }
  delete value.note;
  delete value.forms[0].exampleReading;
  const parsed = parseEntry(JSON.stringify(value));
  expect(parsed.schoolForms[1].label).toBe('连用形');
  expect(parsed.forms.find((f) => f.label === 'ます形')?.schoolForm).toBe('连用形');
  expect(parsed.note).toContain('部分读音');
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

it('accepts nested forms and snake-case payloads without losing parent links', () => {
  const nested = {
    ...demo,
    forms: undefined,
    schoolForms: demo.schoolForms.map((group) => ({
      ...group,
      forms: demo.forms.filter((f) => f.schoolForm === group.label),
    })),
  };
  expect(parseEntry(JSON.stringify(nested)).forms).toHaveLength(demo.forms.length);
  const snake = {
    ...demo,
    schoolForms: undefined,
    school_forms: demo.schoolForms,
    forms: demo.forms.map((f) => ({
      ...f,
      schoolForm: undefined,
      school_form: f.schoolForm,
      exampleReading: undefined,
      example_reading: f.exampleReading,
    })),
  };
  expect(parseEntry(JSON.stringify(snake))).toEqual(demo);
});
