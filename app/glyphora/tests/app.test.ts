import { mount, flushPromises } from '@vue/test-utils';
import { it, expect, vi, beforeEach } from 'vitest';
vi.mock('@lingrove/host-sdk', () => ({
  setRootPage: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
  createID: () => 'round-test',
  isNative: () => false,
  handwriting: { open: vi.fn() },
  moduleStorage: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  }),
}));
vi.mock('../src/render', () => ({
  loadFonts: vi.fn().mockResolvedValue(undefined),
  template: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  raster: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  mask: () => ({ points: [{ x: 1, y: 1 }], ratio: 1, density: 0.1 }),
}));
vi.mock('../src/scoring', () => ({
  assess: vi.fn(() => ({ score: 85, correct: true, status: 'match', feedback: '字形匹配' })),
}));
vi.mock('../src/progress', async (original) => {
  const actual = await original<typeof import('../src/progress')>();
  return {
    ...actual,
    loadProgress: vi.fn(async () => actual.emptyProgress()),
    saveProgress: vi.fn().mockResolvedValue(undefined),
  };
});
import App from '../src/App.vue';
import { assess } from '../src/scoring';
import { loadHistory, saveHistory } from '../src/persistence';
vi.mock('../src/persistence', () => ({
  loadHistory: vi.fn().mockResolvedValue({ practices: [], rounds: [] }),
  saveHistory: vi.fn().mockResolvedValue(undefined),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(assess).mockReturnValue({ score: 85, correct: true, status: 'match', feedback: '字形匹配' });
  vi.mocked(loadHistory).mockResolvedValue({ practices: [], rounds: [] });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
const mountApp = () =>
  mount(App, {
    global: {
      stubs: {
        WritingPad: {
          name: 'WritingPad',
          template:
            '<button class="stub-write" @click="$emit(\'submit\',[[{x:0,y:0},{x:1,y:1}]])">书写提交</button>',
          emits: ['submit', 'ink'],
          methods: { clear() {} },
        },
      },
    },
  });
function button(w: ReturnType<typeof mountApp>, text: string) {
  const buttons = w.findAll('button');
  return buttons.find((b) => (b.attributes('aria-label') || b.text()) === text) ??
    buttons.find((b) => (b.attributes('aria-label') || b.text()).includes(text))!;
}

async function startTest(w: ReturnType<typeof mountApp>) {
  await button(w, '测试').trigger('click');
  await w.get('select[aria-label="测试范围"]').setValue('all');
  await button(w, '开始测试').trigger('click');
}
it('completes ten alternating questions and saves a round under the test tab', async () => {
  const w = mountApp();
  await flushPromises();
  await startTest(w);
  for (let i = 0; i < 10; i++) {
    expect(w.find('.question-counter').text()).toContain(String(i + 1));
    if (i % 2) {
      expect(w.findAll('.choice-grid button')).toHaveLength(4);
      await w.find('.choice-grid button').trigger('click');
    } else {
      expect(w.find('.reference-glyph').exists()).toBe(false);
      await w.find('.stub-write').trigger('click');
      await new Promise((r) => setTimeout(r, 40));
      await flushPromises();
    }
    await button(w, i === 9 ? '查看本轮结果' : '下一题').trigger('click');
    await flushPromises();
  }
  expect(w.text()).toContain('又熟悉了一点');
  expect(w.findAll('.review-list button')).toHaveLength(10);
  expect(saveHistory).toHaveBeenCalledTimes(1);
  await button(w, '返回测试').trigger('click');
  expect(w.findAll('.review-list button')).toHaveLength(1);
  expect(w.text()).not.toContain('继续本轮');
  w.unmount();
});
it('preserves an unfinished round across tab and language changes', async () => {
  const w = mountApp();
  await flushPromises();
  await startTest(w);
  const target = w.find('.print-glyph').text();
  await button(w, '保存并返回测试').trigger('click');
  expect(w.text()).toContain('继续本轮');
  await w.get('select[aria-label="练习语言"]').setValue('ja');
  expect(w.text()).not.toContain('继续本轮');
  await w.get('select[aria-label="练习语言"]').setValue('ru');
  await button(w, '继续本轮').trigger('click');
  expect(w.find('.print-glyph').text()).toBe(target);
  expect(w.find('.question-counter').text()).toContain('1');
  w.unmount();
});
it('opens paired progress cards and enters study directly with case and mode controls', async () => {
  const w = mountApp();
  await flushPromises();
  expect(w.findAll('.segments')).toHaveLength(0);
  await button(w, '查看学习进度').trigger('click');
  expect(w.find('[role="dialog"]').exists()).toBe(false);
  expect(w.find('select[aria-label="练习语言"]').exists()).toBe(false);
  expect(w.findAll('.progress-grid button')).toHaveLength(33);
  expect(w.find('.progress-grid button').text()).toContain('А');
  expect(w.find('.progress-grid button').text()).toContain('а');
  await button(w, '返回学习首页').trigger('click');
  await button(w, '继续学习').trigger('click');
  expect(w.find('[role="dialog"]').exists()).toBe(false);
  expect(w.find('.stub-write').exists()).toBe(true);
  expect(w.find('.print-glyph').text()).toBe('А а');
  await button(w, '大写').trigger('click');
  expect(w.find('.print-glyph').text()).toBe('А а');
  expect(w.find('.writing-method').exists()).toBe(false);
  await button(w, '书写方法').trigger('click');
  expect(w.find('.writing-sheet .stroke-steps').exists()).toBe(true);
  expect(w.find('.order-canvas').exists()).toBe(true);
  expect(w.find('[role="dialog"]').text()).toContain('暂停');
  await button(w, '关闭').trigger('click');
  await w.get('[aria-label="练习模式"]').findAll('button')[1].trigger('click');
  expect(w.find('.reference-glyph').exists()).toBe(false);
  expect(w.find('.print-glyph').exists()).toBe(false);
  expect(
    w
      .get('[aria-label="书写大小写"]')
      .findAll('button')
      .map((b) => b.text()),
  ).toEqual(['大写', '小写']);
  expect(w.text()).toContain('书写方法');
  await button(w, '书写方法').trigger('click');
  expect(w.find('.writing-sheet').exists()).toBe(true);
  await button(w, '关闭').trigger('click');
  await w.find('.stub-write').trigger('click');
  await new Promise((r) => setTimeout(r, 40));
  await flushPromises();
  expect(w.text()).not.toContain('叠加对照范字');
  await button(w, '保存并返回').trigger('click');
  await button(w, '继续学习').trigger('click');
  expect(w.find('.print-glyph').text()).toBe('А а');
  w.unmount();
});
it('opens writing help from the library and practice from progress', async () => {
  const w = mountApp();
  await flushPromises();
  await button(w, '字母').trigger('click');
  expect(w.findAll('.glyph-grid .glyph-card-open')).toHaveLength(33);
  await button(w, '查看 Д · д 的书写说明').trigger('click');
  expect(w.find('.writing-sheet').exists()).toBe(true);
  expect(w.get('.order-print b').text()).toBe('д');
  expect(w.find('.stub-write').exists()).toBe(false);
  await w.get('[aria-label="书写说明大小写"]').findAll('button')[0].trigger('click');
  expect(w.get('.order-print b').text()).toBe('Д');
  await button(w, '练习这个字母').trigger('click');
  expect(w.find('.print-glyph').text()).toBe('Д д');
  expect(w.find('.stub-write').exists()).toBe(true);
  await button(w, '学习').trigger('click');
  await button(w, '查看学习进度').trigger('click');
  await w.findAll('.progress-grid button')[1].trigger('click');
  expect(w.find('.print-glyph').text()).toBe('Б б');
  await button(w, '保存并返回').trigger('click');
  expect(w.findAll('.progress-grid button')).toHaveLength(33);
  w.unmount();
});
it('restores language, letter group and study step after restarting', async () => {
  const { loadProgress, emptyProgress } = await import('../src/progress');
  const saved = emptyProgress();
  saved.language = 'ja';
  saved.lastGroups.ja = 'katakana';
  saved.cursors['ja:katakana'] = { id: 'ja-ア', stage: 'write', strokes: [], feedback: null };
  vi.mocked(loadProgress).mockResolvedValueOnce(saved);
  const w = mountApp();
  await flushPromises();
  await button(w, '继续学习').trigger('click');
  expect(w.get('[aria-label="练习模式"]').findAll('button')[1].attributes('aria-pressed')).toBe(
    'true',
  );
  expect(w.find('.reference-panel').exists()).toBe(false);
  w.unmount();
});

it('skips a learned cursor and keeps legacy Russian groups mixed', async () => {
  const { loadProgress, emptyProgress } = await import('../src/progress');
  const saved = emptyProgress();
  saved.lastGroups.ru = 'lower';
  saved.learned = ['ru-а'];
  saved.cursors['ru:mixed'] = { id: 'ru-а', stage: 'write', strokes: [], feedback: null };
  vi.mocked(loadProgress).mockResolvedValueOnce(saved);
  const w = mountApp();
  await flushPromises();
  await button(w, '查看学习进度').trigger('click');
  expect(w.find('[role="dialog"]').exists()).toBe(false);
  expect(w.find('select[aria-label="练习语言"]').exists()).toBe(false);
  expect(w.findAll('.progress-grid button')).toHaveLength(33);
  expect(w.find('.progress-grid button').attributes('aria-label')).toBe('А · а，未学习');
  expect(w.find('.progress-grid button').classes()).not.toContain('learned');
  expect(w.find('.progress-track i').attributes('style')).toContain('width: 0%');
  await button(w, '返回学习首页').trigger('click');
  await button(w, '继续学习').trigger('click');
  expect(w.find('.print-glyph').text()).toBe('А а');
  w.unmount();
});

it('reports root navigation only on top-level pages, excluding progress and study', async () => {
  const { setRootPage } = await import('@lingrove/host-sdk');
  const w = mountApp();
  await flushPromises();
  expect(setRootPage).toHaveBeenLastCalledWith(true);
  await button(w, '查看学习进度').trigger('click');
  expect(setRootPage).toHaveBeenLastCalledWith(false);
  await button(w, '返回学习首页').trigger('click');
  expect(setRootPage).toHaveBeenLastCalledWith(true);
  await button(w, '继续学习').trigger('click');
  expect(setRootPage).toHaveBeenLastCalledWith(false);
  await button(w, '保存并返回').trigger('click');
  expect(setRootPage).toHaveBeenLastCalledWith(true);
  w.unmount();
});

it('counts a Russian letter only when both cases have been learned', async () => {
  const { loadProgress, emptyProgress } = await import('../src/progress');
  const saved = emptyProgress();
  saved.learned = ['ru-а', 'ru-А', 'ru-б'];
  vi.mocked(loadProgress).mockResolvedValueOnce(saved);
  const w = mountApp();
  await flushPromises();
  expect(w.text()).toContain('已学习 1 / 33 个字母');
  await button(w, '查看学习进度').trigger('click');
  const cards = w.findAll('.progress-grid button');
  expect(cards[0].attributes('aria-label')).toBe('А · а，已学习');
  expect(cards[1].attributes('aria-label')).toBe('Б · б，未学习');
  expect(cards[0].findAll('small')).toHaveLength(0);
  expect(cards[0].text()).not.toContain('已学习');
  expect(cards[1].text()).not.toContain('未学习');
  expect(w.findAll('.progress-grid button.learned')).toHaveLength(1);
  await cards[1].trigger('click');
  expect(w.find('.print-glyph').text()).toBe('Б б');
  await w.get('[aria-label="练习模式"]').findAll('button')[1].trigger('click');
  await w.find('.stub-write').trigger('click');
  await new Promise((r) => setTimeout(r, 40));
  await flushPromises();
  await button(w, '保存并返回').trigger('click');
  expect(w.text()).toContain('已学习 2 / 33 个字母');
  expect(w.findAll('.progress-grid button.learned')).toHaveLength(2);
  w.unmount();
});

it('offers the next letter only after both case tests, excluding tracing scores', async () => {
  const w = mountApp();
  await flushPromises();
  await button(w, '继续学习').trigger('click');
  const grade = async () => {
    await w.find('.stub-write').trigger('click');
    await new Promise((r) => setTimeout(r, 40));
    await flushPromises();
  };
  expect(w.find('.next-letter').exists()).toBe(false);
  expect(w.find('.letter-examples .printed-example').exists()).toBe(true);
  expect(w.findAll('.letter-examples .handwritten-example .handwritten')).toHaveLength(2);
  expect(w.find('.practice-toolbar [aria-label="练习模式"]').exists()).toBe(true);
  expect(w.find('.practice-toolbar [aria-label="书写大小写"]').exists()).toBe(true);
  await grade();
  expect(w.find('.next-letter').exists()).toBe(false);
  await w.get('[aria-label="练习模式"]').findAll('button')[1].trigger('click');
  await grade();
  expect(w.find('.next-letter').exists()).toBe(false);
  await button(w, '大写').trigger('click');
  expect(w.find('.reference-glyph').exists()).toBe(false);
  expect(w.get('[aria-label="练习模式"]').findAll('button')[1].attributes('aria-pressed')).toBe(
    'true',
  );
  await grade();
  expect(w.get('.page-tools .next-letter').text()).toBe('下一个');
  await w.get('.next-letter').trigger('click');
  expect(w.find('.print-glyph').text()).toBe('Б б');
  expect(w.find('.next-letter').exists()).toBe(false);
  w.unmount();
});

it('uses the shared Japanese study layout and switches kana independently in writing help', async () => {
  const { loadProgress, emptyProgress, saveProgress } = await import('../src/progress');
  const saved = emptyProgress();
  saved.language = 'ja';
  saved.cursors['ja:hiragana'] = { id: 'ja-あ', stage: 'observe', strokes: [], feedback: null };
  vi.mocked(loadProgress).mockResolvedValueOnce(saved);
  const w = mountApp();
  await flushPromises();
  await button(w, '继续学习').trigger('click');
  expect(w.find('.study-layout').exists()).toBe(true);
  expect(w.find('.observation').exists()).toBe(false);
  expect(w.find('.stub-write').exists()).toBe(true);
  expect(w.get('[aria-label="练习模式"]').findAll('button')[0].attributes('aria-pressed')).toBe(
    'true',
  );
  await button(w, '书写方法').trigger('click');
  await w.get('[aria-label="书写说明假名"]').findAll('button')[1].trigger('click');
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('ア 第 1 笔');
  await button(w, '关闭').trigger('click');
  expect(w.get('.print-glyph').text()).toBe('あ');
  await w.get('[aria-label="练习模式"]').findAll('button')[1].trigger('click');
  expect(w.find('.handwritten-example').exists()).toBe(false);
  expect(w.find('[aria-label="书写假名"]').exists()).toBe(true);
  const grade = async () => {
    await w.get('[aria-label="练习模式"]').findAll('button')[1].trigger('click');
    await w.find('.stub-write').trigger('click');
    await new Promise((r) => setTimeout(r, 40));
    await flushPromises();
  };
  await grade();
  expect(w.get('.complete-study').attributes('disabled')).toBeDefined();
  await button(w, '片假名').trigger('click');
  expect(w.get('.pronunciation-button').attributes('aria-label')).toContain('ア');
  expect(vi.mocked(saveProgress).mock.lastCall?.[0].cursors['ja:mixed']?.id).toBe('ja-ア');
  await grade();
  await w.get('.next-letter').trigger('click');
  expect(w.get('.print-glyph').text()).toBe('い');
  await button(w, '保存并返回').trigger('click');
  expect(w.find('.segments').exists()).toBe(false);
  expect(w.text()).toContain('已学习 1 / 46 个字母');
  expect(w.findAll('.study-card .glyph-svg')).toHaveLength(2);
  w.unmount();
});

it('studies Greek lowercase and uppercase together with a practice case selector', async () => {
  const { loadProgress, emptyProgress, saveProgress } = await import('../src/progress');
  const saved = emptyProgress();
  saved.language = 'el';
  saved.lastGroups.el = 'upper';
  saved.cursors['el:lower'] = { id: 'el-α', stage: 'trace', strokes: [], feedback: null };
  vi.mocked(loadProgress).mockResolvedValueOnce(saved);
  const w = mountApp();
  await flushPromises();
  expect(w.find('.segments').exists()).toBe(false);
  expect(w.findAll('.study-card .handwritten')).toHaveLength(2);
  await button(w, '继续学习').trigger('click');
  expect(w.get('.print-glyph').text()).toBe('α');
  expect(w.find('[aria-label="书写大小写"]').exists()).toBe(true);
  const grade = async () => {
    await w.get('[aria-label="练习模式"]').findAll('button')[1].trigger('click');
    await w.find('.stub-write').trigger('click');
    await new Promise((r) => setTimeout(r, 40));
    await flushPromises();
  };
  await grade();
  expect(w.get('.complete-study').attributes('disabled')).toBeDefined();
  await button(w, '大写').trigger('click');
  expect(w.get('.pronunciation-button').attributes('aria-label')).toContain('Α');
  expect(vi.mocked(saveProgress).mock.lastCall?.[0].cursors['el:mixed']?.id).toBe('el-Α');
  await grade();
  await w.get('.next-letter').trigger('click');
  expect(w.get('.print-glyph').text()).toBe('β');
  await button(w, '保存并返回').trigger('click');
  expect(w.text()).toContain('已学习 1 / 25 个字母');
  w.unmount();
});

it.each([
  ['ja', '书写假名', 'ja-あ', 'ja-ア', 'い'],
  ['el', '书写大小写', 'el-α', 'el-Α', 'β'],
] as const)(
  'requires both %s forms to pass at 80 or above before advancing',
  async (language, selector, lower, upper, next) => {
    const { loadProgress, emptyProgress, saveProgress } = await import('../src/progress');
    const saved = emptyProgress();
    saved.language = language;
    vi.mocked(loadProgress).mockResolvedValueOnce(saved);
    const w = mountApp();
    await flushPromises();
    await button(w, '继续学习').trigger('click');
    expect(w.get('.complete-study').text()).toBe('下一个');
    const grade = async (score: number) => {
      const retry = w.findAll('button').find((b) => b.text() === '再写一次');
      if (retry) await retry.trigger('click');
      vi.mocked(assess).mockReturnValue({ score, correct: true, status: 'match', feedback: '字形匹配' });
      await w.get('.stub-write').trigger('click');
      await new Promise((r) => setTimeout(r, 40));
      await flushPromises();
    };
    await grade(100); // Tracing never unlocks advancement.
    expect(w.get('.complete-study').attributes('disabled')).toBeDefined();
    await w.get('[aria-label="练习模式"]').findAll('button')[1].trigger('click');
    await grade(79);
    expect(w.get('.complete-study').attributes('disabled')).toBeDefined();
    expect(vi.mocked(saveProgress).mock.lastCall![0].learned).not.toContain(lower);
    await grade(80);
    expect(w.get('.complete-study').attributes('disabled')).toBeDefined();
    const controls = w.get(`[aria-label="${selector}"]`).findAll('button');
    await controls
      .find((b) => b.text() === (language === 'ja' ? '片假名' : '大写'))!
      .trigger('click');
    expect(w.get('.pronunciation-button').attributes('aria-label')).toContain(upper.slice(3));
    await grade(79);
    expect(w.get('.complete-study').attributes('disabled')).toBeDefined();
    await grade(80);
    expect(w.get('.complete-study').attributes('disabled')).toBeUndefined();
    await w.get('.complete-study').trigger('click');
    await flushPromises();
    expect(w.get('.print-glyph').text()).toBe(next);
    const result = vi.mocked(saveProgress).mock.lastCall![0];
    expect(result.learned).toEqual(expect.arrayContaining([lower, upper]));
    expect(result.cursors[`${language}:mixed`].id).toBe(`${language}-${next}`);
    expect(saveHistory).toHaveBeenCalled();
    expect(w.get('.complete-study').attributes('disabled')).toBeDefined();
    w.unmount();
  },
);

it('returns home after both forms of the last letter pass', async () => {
  const { loadProgress, emptyProgress, saveProgress } = await import('../src/progress');
  const saved = emptyProgress();
  saved.language = 'ja';
  saved.cursors['ja:mixed'] = { id: 'ja-ン', stage: 'trace', strokes: [], feedback: null };
  vi.mocked(loadProgress).mockResolvedValueOnce(saved);
  const w = mountApp();
  await flushPromises();
  await button(w, '继续学习').trigger('click');
  await w.get('[aria-label="练习模式"]').findAll('button')[1].trigger('click');
  for (const label of ['片假名', '平假名']) {
    await button(w, label).trigger('click');
    await w.get('.stub-write').trigger('click');
    await new Promise((r) => setTimeout(r, 40));
    await flushPromises();
  }
  await w.get('.complete-study').trigger('click');
  await flushPromises();
  expect(w.find('.study-card').exists()).toBe(true);
  expect(vi.mocked(saveProgress).mock.lastCall![0].learned).toEqual(
    expect.arrayContaining(['ja-ん', 'ja-ン']),
  );
  expect(vi.mocked(saveProgress).mock.lastCall![0].cursors['ja:mixed']).toBeUndefined();
  w.unmount();
});


it('locks study writing during and after scoring until retry, ignoring late ink', async () => {
  const w = mountApp();
  await flushPromises();
  await button(w, '继续学习').trigger('click');
  const pad = w.findComponent({ name: 'WritingPad' });
  await w.get('.stub-write').trigger('click');
  expect(w.get('.stub-write').attributes('disabled')).toBeDefined();
  await new Promise((r) => setTimeout(r, 40));
  await flushPromises();
  expect(w.get('.stub-write').attributes('disabled')).toBeDefined();
  const savedCount = vi.mocked(saveHistory).mock.calls.length;
  pad.vm.$emit('ink', [[{ x: 0.2, y: 0.3 }]]);
  pad.vm.$emit('submit', [[{ x: 0.2, y: 0.3 }]]);
  await flushPromises();
  expect(w.get('.stub-write').attributes('disabled')).toBeDefined();
  expect(vi.mocked(saveHistory).mock.calls.length).toBe(savedCount);
  await button(w, '再写一次').trigger('click');
  expect(w.get('.stub-write').attributes('disabled')).toBeUndefined();
  await w.get('.stub-write').trigger('click');
  await new Promise((r) => setTimeout(r, 40));
  await flushPromises();
  expect(vi.mocked(saveHistory).mock.calls.length).toBe(savedCount + 1);
  await button(w, '大写').trigger('click');
  expect(w.get('.stub-write').attributes('disabled')).toBeUndefined();
  w.unmount();
});
