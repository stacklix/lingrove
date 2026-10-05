import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import CopyButton from '../src/components/CopyButton.vue';
import ResultView from '../src/components/ResultView.vue';
import { validateResult, type Action } from '../src/models';
import { copyText } from '@lingrove/host-sdk';
vi.mock('@lingrove/host-sdk', () => ({ copyText: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});
it('shows copy success only after clipboard completion and restores the button', async () => {
  vi.useFakeTimers();
  let resolve!: () => void;
  vi.mocked(copyText).mockImplementation(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const wrapper = mount(CopyButton, { props: { text: '今日は。' } });
  await wrapper.trigger('click');
  expect(wrapper.text()).toBe('复制中…');
  expect(copyText).toHaveBeenCalledWith('今日は。');
  resolve();
  await flushPromises();
  expect(wrapper.classes()).toContain('copy-success');
  expect(wrapper.text()).toBe('✓ 已复制');
  await vi.advanceTimersByTimeAsync(1800);
  expect(wrapper.text()).toBe('复制');
  wrapper.unmount();
});
it('shows clipboard failure on the button and permits retry', async () => {
  vi.mocked(copyText).mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce();
  const wrapper = mount(CopyButton, { props: { text: 'Hello' } });
  await wrapper.trigger('click');
  await flushPromises();
  expect(wrapper.text()).toBe('复制失败，重试');
  expect(wrapper.classes()).not.toContain('copy-success');
  await wrapper.trigger('click');
  await flushPromises();
  expect(wrapper.text()).toBe('✓ 已复制');
  wrapper.unmount();
});
const cases: [Action, Record<string, any>, string][] = [
  [
    'translate',
    {
      source_language: '中文',
      translation_language: '日语',
      translations: [
        { text: '今日は。', type: 'direct', reading: 'こんにちは。' },
        { text: '今日は。', type: 'natural', reading: 'こんにちは。' },
      ],
      notes: [],
    },
    '你好',
  ],
  [
    'improve',
    {
      source_language: 'Japanese',
      reference_text: '今日は。',
      reference_origin: 'original',
      naturalness: '自然',
      alternatives: [
        {
          text: '今日は。',
          reading: 'こんにちは。',
          style: 'natural',
          translation: '你好',
          explanation: '问候',
        },
      ],
    },
    '今日は。',
  ],
  [
    'grammar',
    {
      source_language: '日本語',
      analysis_text: '学校に行く。',
      analysis_origin: 'original',
      analysis_reading: 'がっこうにいく。',
      correct: true,
      summary: '动作',
      corrections: [],
      structure: [
        { text: '学校', translation: '学校', reading: 'がっこう', part: '名词', role: '目的地' },
      ],
      grammar_points: [],
    },
    '学校に行く。',
  ],
];
it.each(cases)('validates and displays Japanese readings for %s', (action, data, input) => {
  expect(validateResult(action, JSON.stringify(data), input, '日语')).toEqual(data);
  const wrapper = mount(ResultView, { props: { action, data } });
  expect(wrapper.findAll('.kana-reading').length).toBeGreaterThan(0);
  wrapper.unmount();
  const invalid = structuredClone(data);
  if (action === 'grammar') invalid.analysis_reading = '学校に行く';
  else delete invalid[action === 'translate' ? 'translations' : 'alternatives'][0].reading;
  expect(() => validateResult(action, JSON.stringify(invalid), input, '日语')).toThrow();
});
it.each([undefined, null, '', '  '])(
  'keeps Japanese grammar analysis when readings are %s',
  (reading) => {
    const [, original, input] = cases[2];
    const data = {
      ...original,
      analysis_reading: reading,
      structure: original.structure.map((item: Record<string, any>) => ({ ...item, reading })),
    };
    const result = validateResult('grammar', JSON.stringify(data), input, '英语');
    expect(result.analysis_text).toBe(input);
    expect(result).not.toHaveProperty('analysis_reading');
    const wrapper = mount(ResultView, { props: { action: 'grammar', data: result } });
    expect(wrapper.text()).toContain(original.summary);
    expect(wrapper.text()).toContain('学校');
    expect(wrapper.find('.kana-reading').exists()).toBe(false);
    wrapper.unmount();
  },
);
it('keeps Japanese corrections without readings but still requires their explanation', () => {
  const [, original] = cases[2];
  const data = {
    ...original,
    analysis_text: '学校を行く。',
    analysis_reading: undefined,
    correct: false,
    corrections: [{ original: 'を', corrected: 'に', explanation: '目的地使用助词に' }],
  };
  expect(
    validateResult('grammar', JSON.stringify(data), data.analysis_text, '英语').corrections,
  ).toEqual(data.corrections);
  data.corrections[0].explanation = '';
  expect(() => validateResult('grammar', JSON.stringify(data), data.analysis_text, '英语')).toThrow(
    'explanation',
  );
});
it('opens older Japanese history without missing-reading placeholders', () => {
  const wrapper = mount(ResultView, {
    props: { action: 'translate', data: { translations: [{ text: '今日は。', type: 'direct' }] } },
  });
  expect(wrapper.text()).toContain('今日は。');
  expect(wrapper.find('.kana-reading').exists()).toBe(false);
  wrapper.unmount();
});

it('filters punctuation from validated grammar results without altering the original sentence', () => {
  const [, data, input] = cases[2];
  const structure = [
    ...data.structure,
    ...['。', ',', '！？', '…', '—', '「」', ' ； '].map((text) => ({
      text,
      part: '标点',
      role: '分隔',
    })),
  ];
  const result = validateResult('grammar', JSON.stringify({ ...data, structure }), input, '日语');
  expect(result.structure).toEqual(data.structure);
  expect(result.analysis_text).toBe(input);
  expect(result.analysis_reading).toBe(data.analysis_reading);
});
it('filters punctuation in history and streaming structure while keeping punctuation within words', async () => {
  const words = ["don't", 'well-known', 'Hello, world!', '学校', '3.14'];
  const structure = [...words, '.', '、', '？！', '“”', '…', '—'].map((text) => ({
    text,
    part: '成分',
    role: '说明',
  }));
  const wrapper = mount(ResultView, { props: { action: 'grammar', data: { structure } } });
  expect(wrapper.findAll('tbody th').map((cell) => cell.text())).toEqual(words);
  await wrapper.setProps({ data: { structure: [{ text: '。', part: '标点', role: '句末' }] } });
  expect(wrapper.find('.structure').exists()).toBe(false);
  await wrapper.setProps({ data: { structure: [{ text: '学校', part: '名词' }, { text: '、' }] } });
  expect(wrapper.findAll('tbody th').map((cell) => cell.text())).toEqual(['学校']);
  wrapper.unmount();
});

it('shows component translations and tolerates older history and partial streamed results', async () => {
  const wrapper = mount(ResultView, {
    props: {
      action: 'grammar',
      data: {
        structure: [{ text: 'Hello', translation: '你好', part: '感叹词', role: '问候' }],
      },
    },
  });
  expect(wrapper.find('tbody th span').text()).toBe('Hello');
  expect(wrapper.find('.component-translation').text()).toBe('你好');
  await wrapper.setProps({ data: { structure: [{ text: 'Hello' }] } });
  expect(wrapper.find('.component-translation').exists()).toBe(false);
  expect(wrapper.find('tbody th').text()).toBe('Hello');
  wrapper.unmount();
});
