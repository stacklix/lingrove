import { setAppLocale } from '../../../packages/host-sdk/src/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import App from '../src/App.vue';
import { demo, demoSource } from '../src/demo';
import { analysis } from './analysis-fixture';
const mocks = vi.hoisted(() => ({
  importArticle: vi.fn(),
  analyzeSentence: vi.fn(),
  readTextFile: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  root: vi.fn(),
}));
vi.mock('../src/sentence-analysis', async (original) => ({
  ...(await original<typeof import('../src/sentence-analysis')>()),
  analyzeSentence: mocks.analyzeSentence,
}));
vi.mock('../src/import', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/import')>()),
  importArticle: mocks.importArticle,
  readTextFile: mocks.readTextFile,
}));
vi.mock('@lingrove/host-sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@lingrove/host-sdk')>()),
  ready: vi.fn().mockResolvedValue(undefined),
  setRootPage: mocks.root,
  isNative: () => false,
  createID: () => 'reading-1',
  moduleStorage: () => ({ get: mocks.get, set: mocks.set }),
}));
beforeEach(() => {
  setAppLocale('zh-Hans');
  vi.clearAllMocks();
  mocks.get.mockResolvedValue(null);
  mocks.set.mockResolvedValue(undefined);
  mocks.root.mockResolvedValue(undefined);
  mocks.importArticle.mockResolvedValue(structuredClone(demo));
  mocks.analyzeSentence.mockResolvedValue(structuredClone(analysis));
  mocks.readTextFile.mockResolvedValue(demoSource);
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});
async function setup() {
  const w = mount(App);
  await flushPromises();
  return w;
}
async function begin(w: Awaited<ReturnType<typeof setup>>) {
  await w.get('[aria-label="导入文章"]').trigger('click');
  await w.get('.import-menu button').trigger('click');
}
async function submit(w: Awaited<ReturnType<typeof setup>>) {
  await w.get('textarea').setValue(demoSource);
  await w.get('form').trigger('submit');
  await flushPromises();
}
describe('article-first reading', () => {
  it('starts with article list, an import menu, and exactly two bottom tabs', async () => {
    const w = await setup();
    expect(w.find('.brand').exists()).toBe(false);
    expect(w.find('.library').exists()).toBe(true);
    expect(w.findAll('.bottom-tabs button')).toHaveLength(2);
    await begin(w);
    expect(w.get('.import-sheet').attributes()).toHaveProperty('open');
    w.unmount();
  });
  it('precomputes data on import, keeps the list as home and opens without another request', async () => {
    const w = await setup();
    await begin(w);
    await w.get('#article-title').setValue('图书馆');
    await submit(w);
    expect(w.find('.reading-paper').exists()).toBe(false);
    expect(w.get('.article-card').text()).toContain('图书馆');
    const saved = mocks.set.mock.calls.at(-1)![1];
    expect(saved.library[0].source).toBe(demoSource);
    await w.get('.article-open').trigger('click');
    await flushPromises();
    expect(w.find('.reading-paper').exists()).toBe(true);
    expect(w.findAll('input[type="checkbox"]')).toHaveLength(1);
    expect(w.find('.phrase').exists()).toBe(false);
    expect(w.get('.sentence-text').classes()).toContain('has-ruby');
    await w.get('.sentence-trigger').trigger('click');
    if (w.find('.analyze-sentence').exists()) await w.get('.analyze-sentence').trigger('click');
    await flushPromises();
    expect(w.get('.analysis-components').text()).toContain('话题');
    expect(mocks.importArticle).toHaveBeenCalledTimes(1);
    expect(mocks.analyzeSentence).toHaveBeenCalledTimes(1);
    await w.get('[aria-label="关闭句子解析"]').trigger('click');
    await w.get('input[type="checkbox"]').setValue(false);
    expect(w.findAll('ruby')).toHaveLength(0);
    expect(w.get('.sentence-text').classes()).not.toContain('has-ruby');
    w.unmount();
    mocks.get.mockResolvedValue(saved);
    const reopened = await setup();
    expect(reopened.find('.library').exists()).toBe(true);
    expect(reopened.find('.reader-nav').exists()).toBe(false);
    reopened.unmount();
  });
  it('ignores late model results after cancellation', async () => {
    let finish!: (value: typeof demo) => void;
    mocks.importArticle.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const w = await setup();
    await begin(w);
    await submit(w);
    await w.get('.pending-card .article-open').trigger('click');
    await w.get('[aria-labelledby="job-title"] .secondary').trigger('click');
    expect(mocks.importArticle.mock.calls[0][1].aborted).toBe(true);
    finish(demo);
    await flushPromises();
    expect(w.get('.pending-card').text()).toContain('分析已暂停');
    expect(mocks.set.mock.calls.at(-1)![1].library).toHaveLength(0);
    w.unmount();
  });
  it('preserves failed import text and exposes saving failures', async () => {
    const w = await setup();
    await begin(w);
    mocks.importArticle.mockRejectedValueOnce(new Error('解析失败'));
    await submit(w);
    await w.get('.pending-card .article-open').trigger('click');
    expect(w.get('[aria-labelledby="job-title"]').text()).toContain('解析失败');
    expect(mocks.set.mock.calls.at(-1)![1].jobs[0].source).toBe(demoSource);
    mocks.set.mockRejectedValue(new Error('full'));
    await w.get('[aria-labelledby="job-title"] .primary').trigger('click');
    await flushPromises();
    expect(w.find('.article-card').exists()).toBe(true);
    expect(w.text()).toContain('本地保存失败');
    w.unmount();
  });
  it('loads file text into import dialog and precomputes it after submission', async () => {
    const w = await setup();
    const file = new File([demoSource], '文章.txt', { type: 'text/plain' });
    Object.defineProperty(w.get('[type="file"]').element, 'files', {
      value: [file],
      configurable: true,
    });
    await w.get('[type="file"]').trigger('change');
    await flushPromises();
    expect(w.get('.import-sheet').attributes()).toHaveProperty('open');
    expect((w.get('#article-title').element as HTMLInputElement).value).toBe('文章');
    await w.get('form').trigger('submit');
    await flushPromises();
    expect(w.get('.article-card').text()).toContain('文章');
    w.unmount();
  });
  it('records contextual lookups and shows article and reading statistics', async () => {
    const w = await setup();
    await begin(w);
    await submit(w);
    await w.get('.article-open').trigger('click');
    await flushPromises();
    await w.get('.sentence-trigger').trigger('click');
    if (w.find('.analyze-sentence').exists()) await w.get('.analyze-sentence').trigger('click');
    await flushPromises();
    await w.get('[aria-label="关闭句子解析"]').trigger('click');
    await w.get('.reader-nav button').trigger('click');
    await w.findAll('.bottom-tabs button')[1].trigger('click');
    expect(w.get('.data-page').text()).toContain('查看解析 1 次');
    expect(w.get('.data-page').text()).toContain('累计打开 1 次');
    await w.get('.delete').trigger('click');
    await w.get('.confirm-delete').trigger('click');
    expect(w.find('.data-article').exists()).toBe(false);
    w.unmount();
  });
});

it('does not treat dialog autofocus as keyboard navigation, but preserves Tab focus mode', async () => {
  const w = await setup();
  await begin(w);
  const close = w.get('[aria-label="关闭导入"]').element as HTMLButtonElement;
  close.focus();
  expect(document.documentElement.dataset.keyboardFocus).toBeUndefined();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  expect(document.documentElement.dataset.keyboardFocus).toBe('true');
  document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  expect(document.documentElement.dataset.keyboardFocus).toBeUndefined();
  expect(w.get('.import-sheet').attributes()).toHaveProperty('open');
  w.unmount();
  expect(document.documentElement.dataset.focusMode).toBeUndefined();
});

it('preserves a titled draft across dismissal and reload without prefilled examples', async () => {
  const w = await setup();
  await begin(w);
  expect((w.get('textarea').element as HTMLTextAreaElement).value).toBe('');
  await w.get('#article-title').setValue('未完成的文章');
  await w.get('textarea').setValue(demoSource);
  await w.get('[aria-label="关闭导入"]').trigger('click');
  await flushPromises();
  const saved = mocks.set.mock.calls.at(-1)![1];
  await begin(w);
  expect((w.get('textarea').element as HTMLTextAreaElement).value).toBe(demoSource);
  w.unmount();
  mocks.get.mockResolvedValue(saved);
  const reopened = await setup();
  await begin(reopened);
  expect((reopened.get('#article-title').element as HTMLInputElement).value).toBe('未完成的文章');
  expect((reopened.get('textarea').element as HTMLTextAreaElement).value).toBe(demoSource);
  reopened.unmount();
});
it('analyzes outside the import dialog, reports progress, and allows tab changes', async () => {
  let finish!: (value: typeof demo) => void;
  mocks.importArticle.mockImplementation((_source, _signal, progress) => {
    progress(1, 3);
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const w = await setup();
  await begin(w);
  await submit(w);
  expect(w.get('.import-sheet').attributes('open')).toBeUndefined();
  expect(w.get('.pending-card').text()).toContain('1/3');
  await w.findAll('.bottom-tabs button')[1].trigger('click');
  expect(w.get('.data-page').text()).toContain('1 篇待完成分析');
  await w.get('.data-article button').trigger('click');
  expect(w.get('[aria-labelledby="job-title"] progress').attributes('value')).toBe('1');
  await w.get('[aria-label="关闭分析进度"]').trigger('click');
  expect(mocks.importArticle.mock.calls[0][1].aborted).toBe(false);
  finish(demo);
  await flushPromises();
  expect(mocks.set.mock.calls.at(-1)![1].jobs).toHaveLength(0);
  expect(mocks.set.mock.calls.at(-1)![1].library).toHaveLength(1);
  w.unmount();
});
it('does not resurrect a deleted pending article after a late response', async () => {
  let finish!: (value: typeof demo) => void;
  mocks.importArticle.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.findAll('.bottom-tabs button')[1].trigger('click');
  await w.get('.delete').trigger('click');
  await w.get('.confirm-delete').trigger('click');
  finish(demo);
  await flushPromises();
  expect(mocks.set.mock.calls.at(-1)![1].jobs).toHaveLength(0);
  expect(mocks.set.mock.calls.at(-1)![1].library).toHaveLength(0);
  w.unmount();
});

it('caches sentence analysis across reopen and reload, without analyzing during import', async () => {
  const w = await setup();
  await begin(w);
  await submit(w);
  expect(mocks.analyzeSentence).not.toHaveBeenCalled();
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.sentence-trigger').trigger('click');
  if (w.find('.analyze-sentence').exists()) await w.get('.analyze-sentence').trigger('click');
  await flushPromises();
  await w.get('[aria-label="关闭句子解析"]').trigger('click');
  await w.get('.sentence-trigger').trigger('click');
  if (w.find('.analyze-sentence').exists()) await w.get('.analyze-sentence').trigger('click');
  await flushPromises();
  expect(mocks.analyzeSentence).toHaveBeenCalledTimes(1);
  const saved = mocks.set.mock.calls.at(-1)![1];
  expect(saved.library[0].analyses[JSON.stringify(analysis.analysis_text)]).toEqual(analysis);
  w.unmount();
  mocks.get.mockResolvedValue(saved);
  const restored = await setup();
  await restored.get('.article-open').trigger('click');
  await flushPromises();
  await restored.get('.sentence-trigger').trigger('click');
  await flushPromises();
  expect(mocks.analyzeSentence).toHaveBeenCalledTimes(1);
  expect(restored.get('.analysis-sheet').text()).toContain('本句谓语');
  restored.unmount();
});
it('deduplicates pending clicks and caches results arriving after sheet closure', async () => {
  let finish!: (value: typeof analysis) => void;
  mocks.analyzeSentence.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.sentence-trigger').trigger('click');
  if (w.find('.analyze-sentence').exists()) await w.get('.analyze-sentence').trigger('click');
  await w.get('.sentence-trigger').trigger('click');
  if (w.find('.analyze-sentence').exists()) await w.get('.analyze-sentence').trigger('click');
  expect(mocks.analyzeSentence).toHaveBeenCalledTimes(1);
  await w.get('[aria-label="关闭句子解析"]').trigger('click');
  expect(mocks.analyzeSentence.mock.calls[0][2].aborted).toBe(false);
  finish(analysis);
  await flushPromises();
  expect(
    mocks.set.mock.calls.at(-1)![1].library[0].analyses?.[JSON.stringify(analysis.analysis_text)],
  ).toEqual(analysis);
  expect(w.get('.sentence').classes()).toContain('cached');
  expect(w.get('.analysis-sheet').attributes()).not.toHaveProperty('open');
  w.unmount();
});
it('allows a failed sentence request to retry without caching the failure', async () => {
  mocks.analyzeSentence.mockRejectedValueOnce(new Error('连接失败'));
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.sentence-trigger').trigger('click');
  if (w.find('.analyze-sentence').exists()) await w.get('.analyze-sentence').trigger('click');
  await flushPromises();
  expect(w.get('.analysis-sheet [role="alert"]').text()).toContain('连接失败');
  await w.get('.analysis-sheet .text-button').trigger('click');
  await flushPromises();
  expect(w.get('.analysis-components').text()).toContain('话题');
  w.unmount();
});

it('opens the sheet without calling the model and requires explicit analysis confirmation', async () => {
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.sentence-text').trigger('click');
  expect(mocks.analyzeSentence).not.toHaveBeenCalled();
  expect(w.get('.analysis-original').text()).toBe(demoSource);
  expect(w.get('.analyze-sentence').text()).toBe('分析');
  await w.get('[aria-label="关闭句子解析"]').trigger('click');
  expect(mocks.analyzeSentence).not.toHaveBeenCalled();
  await w.get('.sentence-text').trigger('keydown', { key: 'Enter' });
  expect(mocks.analyzeSentence).not.toHaveBeenCalled();
  await w.get('.analyze-sentence').trigger('click');
  await flushPromises();
  expect(mocks.analyzeSentence).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('hides the reading toolbar as content moves up and reveals it on reverse scroll or at the top', async () => {
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.article-open').trigger('click');
  await flushPromises();
  const height = vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(3000);
  const y = vi.spyOn(window, 'scrollY', 'get');
  const scroll = async (value: number) => {
    y.mockReturnValue(value);
    window.dispatchEvent(new Event('scroll'));
    await flushPromises();
  };
  await scroll(200);
  expect(w.get('.reader-nav').classes()).toContain('is-hidden');
  await scroll(196);
  expect(w.get('.reader-nav').classes()).toContain('is-hidden');
  await scroll(180);
  expect(w.get('.reader-nav').classes()).not.toContain('is-hidden');
  await scroll(250);
  expect(w.get('.reader-nav').classes()).toContain('is-hidden');
  await scroll(0);
  expect(w.get('.reader-nav').classes()).not.toContain('is-hidden');
  w.unmount();
  height.mockRestore();
  y.mockRestore();
});

it('keeps the article and cached analysis when delete confirmation is cancelled or dismissed', async () => {
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.findAll('.bottom-tabs button')[1].trigger('click');
  const before = structuredClone(mocks.set.mock.calls.at(-1)![1]);
  await w.get('.delete').trigger('click');
  expect(w.find('.data-article').exists()).toBe(true);
  expect(w.get('.delete-sheet').attributes()).toHaveProperty('open');
  expect(w.get('#delete-description').text()).toContain('无法恢复');
  expect(w.find('.delete-sheet .secondary').exists()).toBe(false);
  await w.get('[aria-label="关闭删除确认"]').trigger('click');
  expect(w.find('.data-article').exists()).toBe(true);
  expect(mocks.set.mock.calls.at(-1)![1]).toEqual(before);
  await w.get('.delete').trigger('click');
  await w.get('[aria-label="关闭删除确认"]').trigger('click');
  expect(w.find('.data-article').exists()).toBe(true);
  w.unmount();
});

it('deletes the completed article if background analysis finishes during confirmation', async () => {
  let finish!: (value: typeof demo) => void;
  mocks.importArticle.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.findAll('.bottom-tabs button')[1].trigger('click');
  await w.get('.delete').trigger('click');
  expect(mocks.importArticle.mock.calls[0][1].aborted).toBe(false);
  finish(demo);
  await flushPromises();
  expect(w.find('.data-article').exists()).toBe(true);
  await w.get('.confirm-delete').trigger('click');
  await flushPromises();
  expect(mocks.set.mock.calls.at(-1)![1].library).toHaveLength(0);
  expect(mocks.set.mock.calls.at(-1)![1].jobs).toHaveLength(0);
  w.unmount();
});

it('does not reuse another language analysis after switching the app language', async () => {
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.sentence-trigger').trigger('click');
  await w.get('.analyze-sentence').trigger('click');
  await flushPromises();
  expect(w.find('.analysis-results').exists()).toBe(true);
  setAppLocale('en');
  await flushPromises();
  expect(w.find('.analysis-results').exists()).toBe(false);
  expect(w.get('.analysis-original').text()).toBe(demoSource);
  mocks.analyzeSentence.mockResolvedValueOnce({
    ...analysis,
    language: 'en',
    translation: 'I read at the library yesterday.',
  });
  await w.get('.analyze-sentence').trigger('click');
  await flushPromises();
  expect(mocks.analyzeSentence).toHaveBeenCalledTimes(2);
  expect(w.get('.analysis-results').text()).toContain('I read at the library yesterday.');
  expect(mocks.set.mock.calls.at(-1)![1].library[0].source).toBe(demoSource);
  w.unmount();
  setAppLocale('zh-Hans');
});

it('opens and analyzes only one sentence when a model batch contains three', async () => {
  const combined = structuredClone(demo);
  combined.sentences = [
    {
      ...combined.sentences[0],
      tokens: Array.from({ length: 3 }, () => structuredClone(demo.sentences[0].tokens)).flat(),
    },
  ];
  mocks.importArticle.mockResolvedValue(combined);
  const w = await setup();
  await begin(w);
  await w.get('textarea').setValue(demoSource.repeat(3));
  await w.get('form').trigger('submit');
  await flushPromises();
  await w.get('.article-open').trigger('click');
  await flushPromises();
  expect(w.findAll('.sentence-trigger')).toHaveLength(3);
  await w.findAll('.sentence-trigger')[1].trigger('click');
  expect(w.get('.analysis-original').text()).toBe(demoSource);
  await w.get('.analyze-sentence').trigger('click');
  await flushPromises();
  expect(mocks.analyzeSentence.mock.calls[0][0]).toBe(demoSource);
  expect(mocks.analyzeSentence.mock.calls[0][1]).toEqual({ before: demoSource, after: demoSource });
  const saved = structuredClone(mocks.set.mock.calls.at(-1)![1]);
  w.unmount();
  mocks.get.mockResolvedValue(saved);
  const restored = await setup();
  await restored.get('.article-open').trigger('click');
  await flushPromises();
  expect(restored.findAll('.sentence-trigger')).toHaveLength(3);
  await restored.findAll('.sentence-trigger')[1].trigger('click');
  expect(restored.get('.analysis-original').text()).toBe(demoSource);
  expect(restored.find('.analysis-results').exists()).toBe(true);
  restored.unmount();
});

it('closes sentence analysis on a backdrop tap, keeps its request running, and keeps inside taps open', async () => {
  mocks.analyzeSentence.mockImplementation(() => new Promise(() => {}));
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.sentence-trigger').trigger('click');
  const dialog = w.get('.analysis-sheet');
  vi.spyOn(dialog.element, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 390,
    top: 400,
    bottom: 844,
  } as DOMRect);
  await dialog.trigger('pointerdown', { clientX: 30, clientY: 450 });
  await dialog.trigger('click', { clientX: 30, clientY: 450 });
  expect(dialog.attributes()).toHaveProperty('open');
  // A drag beginning inside the sheet is not a backdrop tap.
  await dialog.trigger('pointerdown', { clientX: 30, clientY: 450 });
  await dialog.trigger('click', { clientX: 30, clientY: 200 });
  expect(dialog.attributes()).toHaveProperty('open');
  await w.get('.analyze-sentence').trigger('click');
  await dialog.trigger('pointerdown', { clientX: 30, clientY: 200 });
  await dialog.trigger('click', { clientX: 30, clientY: 200 });
  expect(dialog.attributes()).not.toHaveProperty('open');
  expect(mocks.analyzeSentence.mock.calls[0][2].aborted).toBe(false);
  w.unmount();
});

it('retains background progress on reopen and isolates results while another sentence is selected', async () => {
  const second = structuredClone(demo.sentences[0]);
  second.tokens[0].text = '彼';
  second.tokens[0].ruby = [{ text: '彼', reading: 'かれ' }];
  const secondText = second.tokens.map((token) => token.text).join('');
  mocks.importArticle.mockResolvedValue({ ...demo, sentences: [demo.sentences[0], second] });
  let finish!: (value: typeof analysis) => void;
  mocks.analyzeSentence.mockImplementation((_source, _context, _signal, onStatus) => {
    onStatus({ elapsedMs: 5000, outputTokens: 123, estimated: false });
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const w = await setup();
  await begin(w);
  await w.get('textarea').setValue(demoSource + secondText);
  await w.get('form').trigger('submit');
  await flushPromises();
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.findAll('.sentence-trigger')[0].trigger('click');
  await w.get('.analyze-sentence').trigger('click');
  await w.get('[aria-label="关闭句子解析"]').trigger('click');
  await w.findAll('.sentence-trigger')[0].trigger('click');
  expect(w.findAll('.sentence')[0].classes()).toContain('analyzing');
  expect(w.findAll('.sentence-trigger')[0].attributes('aria-busy')).toBe('true');
  expect(w.findAll('.sentence')[1].classes()).not.toContain('analyzing');
  expect(w.get('.sentence-progress').text()).toContain('123');
  expect(w.find('.analyze-sentence').exists()).toBe(false);
  expect(mocks.analyzeSentence).toHaveBeenCalledTimes(1);
  await w.get('[aria-label="关闭句子解析"]').trigger('click');
  await w.findAll('.sentence-trigger')[1].trigger('click');
  finish(analysis);
  await flushPromises();
  expect(w.get('.analysis-original').text()).toBe(secondText);
  expect(w.find('.analysis-results').exists()).toBe(false);
  expect(w.findAll('.sentence')[0].classes()).toContain('cached');
  expect(w.findAll('.sentence')[0].classes()).not.toContain('analyzing');
  expect(w.findAll('.sentence-trigger')[0].attributes('aria-busy')).toBe('false');
  expect(w.findAll('.sentence')[1].classes()).not.toContain('cached');
  expect(mocks.set.mock.calls.at(-1)![1].library[0].analyses[JSON.stringify(demoSource)]).toEqual(
    analysis,
  );
  w.unmount();
});
