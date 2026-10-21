import { setAppLocale } from '../../../packages/host-sdk/src/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import App from '../src/App.vue';
import { demo, demoSource } from '../src/demo';
import { analysis } from './analysis-fixture';
import { translationKey } from '../src/sentence-translations';
const mocks = vi.hoisted(() => ({
  importArticle: vi.fn(),
  analyzeSentence: vi.fn(),
  readTextFile: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  root: vi.fn(),
  play: vi.fn(),
  ttsStatus: vi.fn(),
  prefetchTranslations: vi.fn(),
  generateArticle: vi.fn(),
}));
vi.mock('../src/generation', async (original) => ({
  ...(await original<typeof import('../src/generation')>()),
  generateArticle: mocks.generateArticle,
}));
vi.mock('../src/sentence-translations', async (original) => ({
  ...(await original<typeof import('../src/sentence-translations')>()),
  prefetchTranslations: mocks.prefetchTranslations,
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
  tts: { play: mocks.play, status: mocks.ttsStatus },
  ready: vi.fn().mockResolvedValue(undefined),
  setRootPage: mocks.root,
  isNative: () => false,
  createID: () => 'reading-1',
  moduleStorage: () => ({ get: mocks.get, set: mocks.set }),
}));
beforeEach(() => {
  setAppLocale('zh-Hans');
  vi.clearAllMocks();
  mocks.generateArticle.mockReset();
  mocks.get.mockResolvedValue(null);
  mocks.set.mockResolvedValue(undefined);
  mocks.root.mockResolvedValue(undefined);
  mocks.importArticle.mockResolvedValue(structuredClone(demo));
  mocks.analyzeSentence.mockResolvedValue(structuredClone(analysis));
  mocks.readTextFile.mockResolvedValue(demoSource);
  mocks.ttsStatus.mockResolvedValue({ voices: [] });
  mocks.prefetchTranslations.mockReset().mockResolvedValue({});
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
describe('sentence translations', () => {
  const key = translationKey(demoSource, 'ja', 'zh-Hans');
  const translations = {
    [key]: {
      source: demoSource,
      sourceLanguage: 'ja' as const,
      language: 'zh-Hans',
      translation: '昨天我在图书馆读书。',
    },
  };

  it('defaults prefetch off and hides missing translation until analysis succeeds, then persists it', async () => {
    const w = await setup();
    await begin(w);
    expect((w.get('#import-translations').element as HTMLInputElement).checked).toBe(false);
    await submit(w);
    expect(mocks.prefetchTranslations).not.toHaveBeenCalled();
    await w.get('.article-open').trigger('click');
    await flushPromises();
    await w.get('.sentence-trigger').trigger('click');
    expect(w.find('.sentence-translation').exists()).toBe(false);
    expect(mocks.analyzeSentence).not.toHaveBeenCalled();
    await w.get('.analyze-sentence').trigger('click');
    await flushPromises();
    expect(w.get('.sentence-translation').text()).toContain(analysis.translation);
    expect(w.findAll('.sentence-translation')).toHaveLength(1);
    const saved = structuredClone(mocks.set.mock.calls.at(-1)![1]);
    expect(saved.library[0].translations[key].translation).toBe(analysis.translation);
    w.unmount();
    mocks.get.mockResolvedValue(saved);
    const reopened = await setup();
    await reopened.get('.article-open').trigger('click');
    await flushPromises();
    await reopened.get('.sentence-trigger').trigger('click');
    expect(reopened.get('.sentence-translation').text()).toContain(analysis.translation);
    expect(mocks.analyzeSentence).toHaveBeenCalledTimes(1);
    reopened.unmount();
  });

  it('shows prefetched translation immediately, retains it during analysis and replaces it with the analysis translation', async () => {
    mocks.prefetchTranslations.mockResolvedValue(translations);
    let finish!: (value: typeof analysis) => void;
    mocks.analyzeSentence.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const w = await setup();
    await begin(w);
    await w.get('#import-translations').setValue(true);
    await submit(w);
    expect(mocks.prefetchTranslations.mock.calls[0][1]).toBe('zh-Hans');
    expect(mocks.set.mock.calls.at(-1)![1].draftTranslate).toBe(true);
    expect(mocks.set.mock.calls.at(-1)![1].library[0].translations).toEqual(translations);
    await w.get('.article-open').trigger('click');
    await flushPromises();
    await w.get('.sentence-trigger').trigger('click');
    expect(w.get('.sentence-translation').text()).toContain(translations[key].translation);
    expect(w.find('.analysis-results').exists()).toBe(false);
    expect(mocks.analyzeSentence).not.toHaveBeenCalled();
    await w.get('.analyze-sentence').trigger('click');
    expect(w.get('.sentence-translation').text()).toContain(translations[key].translation);
    expect(w.find('.sentence-progress').exists()).toBe(true);
    finish(analysis);
    await flushPromises();
    expect(w.get('.sentence-translation').text()).toContain(analysis.translation);
    expect(w.findAll('.sentence-translation')).toHaveLength(1);
    expect(mocks.set.mock.calls.at(-1)![1].library[0].translations[key].translation).toBe(
      analysis.translation,
    );
    w.unmount();
  });

  it('does not display a translation for a different UI language and restores it when switching back', async () => {
    mocks.prefetchTranslations.mockResolvedValue(translations);
    const w = await setup();
    await begin(w);
    await w.get('#import-translations').setValue(true);
    await submit(w);
    await w.get('.article-open').trigger('click');
    await flushPromises();
    await w.get('.sentence-trigger').trigger('click');
    expect(w.find('.sentence-translation').exists()).toBe(true);
    setAppLocale('en');
    await flushPromises();
    expect(w.find('.sentence-translation').exists()).toBe(false);
    setAppLocale('zh-Hans');
    await flushPromises();
    expect(w.get('.sentence-translation').text()).toContain(translations[key].translation);
    expect(mocks.analyzeSentence).not.toHaveBeenCalled();
    w.unmount();
  });

  it('resumes a failed translation job with saved translations and its original target language', async () => {
    mocks.prefetchTranslations
      .mockImplementationOnce(
        async (_reading, _language, _signal, _cache, checkpoint, progress) => {
          await checkpoint(translations);
          progress({ done: 1, total: 2 });
          throw new Error('网络中断');
        },
      )
      .mockResolvedValue(translations);
    const w = await setup();
    await begin(w);
    await w.get('#import-translations').setValue(true);
    await submit(w);
    expect(w.find('.article-card:not(.pending-card)').exists()).toBe(false);
    const saved = structuredClone(mocks.set.mock.calls.at(-1)![1]);
    expect(saved.jobs[0].translations).toEqual(translations);
    w.unmount();
    setAppLocale('en');
    mocks.get.mockResolvedValue(saved);
    const resumed = await setup();
    await resumed.get('.pending-card .article-open').trigger('click');
    await resumed.get('[aria-labelledby="job-title"] .primary').trigger('click');
    await flushPromises();
    expect(mocks.prefetchTranslations.mock.calls.at(-1)![1]).toBe('zh-Hans');
    expect(mocks.prefetchTranslations.mock.calls.at(-1)![3]).toEqual(translations);
    expect(mocks.set.mock.calls.at(-1)![1].library[0].translations).toEqual(translations);
    expect(mocks.set.mock.calls.at(-1)![1].jobs).toHaveLength(0);
    resumed.unmount();
  });

  it('keeps an import paused when its translation request finishes after cancellation', async () => {
    let finish!: (value: typeof translations) => void;
    mocks.prefetchTranslations.mockImplementation(
      (_reading, _language, _signal, _cache, _checkpoint, progress) => {
        progress({ done: 0, total: 1 });
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    );
    const w = await setup();
    await begin(w);
    await w.get('#import-translations').setValue(true);
    await submit(w);
    expect(w.get('.pending-card').text()).toContain('翻译中');
    await w.get('.pending-card .article-open').trigger('click');
    expect(w.get('[aria-labelledby="job-title"]').text()).toContain('缓存句子翻译：0 / 1 句');
    await w.get('[aria-labelledby="job-title"] .secondary').trigger('click');
    expect(mocks.prefetchTranslations.mock.calls[0][2].aborted).toBe(true);
    finish(translations);
    await flushPromises();
    expect(mocks.set.mock.calls.at(-1)![1].library).toHaveLength(0);
    expect(mocks.set.mock.calls.at(-1)![1].jobs[0].status).toBe('paused');
    w.unmount();
  });
});
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
    expect(w.findAll('.reader-nav input[type="checkbox"]')).toHaveLength(1);
    expect(w.find('.phrase').exists()).toBe(false);
    expect(w.get('.sentence-text').classes()).toContain('has-ruby');
    await w.get('.sentence-trigger').trigger('click');
    if (w.find('.analyze-sentence').exists()) await w.get('.analyze-sentence').trigger('click');
    await flushPromises();
    expect(w.get('.analysis-components').text()).toContain('话题');
    expect(mocks.importArticle).toHaveBeenCalledTimes(1);
    expect(mocks.analyzeSentence).toHaveBeenCalledTimes(1);
    await w.get('[aria-label="关闭句子解析"]').trigger('click');
    await w.get('.reader-nav input[type="checkbox"]').setValue(false);
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
  expect(
    saved.library[0].analyses[JSON.stringify([analysis.analysis_text, 'ja', analysis.language])],
  ).toEqual({ ...analysis, sourceLanguage: 'ja' });
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
    mocks.set.mock.calls.at(-1)![1].library[0].analyses?.[
      JSON.stringify([analysis.analysis_text, 'ja', analysis.language])
    ],
  ).toEqual({ ...analysis, sourceLanguage: 'ja' });
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
  expect(w.get('.sentence-translation').text()).toContain('I read at the library yesterday.');
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
  expect(mocks.analyzeSentence.mock.calls[0][1]).toEqual({
    before: demoSource,
    after: demoSource,
    sourceLanguage: 'ja',
  });
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
  expect(
    mocks.set.mock.calls.at(-1)![1].library[0].analyses[
      JSON.stringify([demoSource, 'ja', analysis.language])
    ],
  ).toEqual({ ...analysis, sourceLanguage: 'ja' });
  w.unmount();
});

it('floats a play button, expands progress, and stops on the second click', async () => {
  const scrollIntoView = vi.fn();
  const sentenceElement = document.createElement('span');
  sentenceElement.scrollIntoView = scrollIntoView;
  const lookup = vi.spyOn(document, 'getElementById').mockReturnValue(sentenceElement);
  let onState!: (state: string) => void;
  const stop = vi.fn().mockResolvedValue(undefined);
  mocks.play.mockImplementation((_input, options) => {
    onState = options.onState;
    return {
      finished: new Promise(() => {}),
      stop,
      pause: vi.fn(async () => options.onState('paused')),
      resume: vi.fn(async () => options.onState('playing')),
    };
  });
  const w = await setup();
  await w.get('.empty button').trigger('click');
  expect(w.find('.speech-progress').exists()).toBe(false);
  await w.get('.speech-toggle').trigger('click');
  expect(w.find('.speech-progress').exists()).toBe(true);
  expect(w.find('.speech-spinner').exists()).toBe(false);
  expect(w.find('.sentence.speaking').exists()).toBe(false);
  scrollIntoView.mockClear();
  onState('playing');
  await flushPromises();
  expect(w.findAll('.sentence')[0].classes()).toContain('speaking');
  expect(lookup).toHaveBeenLastCalledWith('sentence-0');
  expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  expect(w.get('.speech-toggle').attributes('aria-label')).toBe('停止朗读');
  expect(w.find('.speech-toggle rect').exists()).toBe(true);
  await w.get('.speech-toggle').trigger('click');
  expect(stop).toHaveBeenCalledOnce();
  expect(w.find('.sentence.speaking').exists()).toBe(false);
  expect(w.find('.speech-progress').exists()).toBe(false);
  expect(w.get('.speech-toggle').attributes('aria-label')).toBe('开始朗读');
  w.unmount();
  lookup.mockRestore();
});

it('saves the article voice, restores it on reload, and lets app settings take over again', async () => {
  mocks.ttsStatus.mockResolvedValue({
    voices: [{ id: 'voice-a', title: 'Voice A', language: 'ja' }],
  });
  mocks.play.mockImplementation(() => ({
    finished: new Promise(() => {}),
    stop: vi.fn().mockResolvedValue(undefined),
  }));
  let w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.speech-toggle').trigger('click');
  await w.get('.speech-settings').trigger('click');
  await flushPromises();
  await w.get('.voice-settings-content select').setValue('voice-a');
  await flushPromises();
  expect(mocks.play.mock.calls.at(-1)![0].voice).toBe('voice-a');
  const saved = structuredClone(mocks.set.mock.calls.at(-1)![1]);
  expect(saved.library[0].speechVoice).toBe('voice-a');
  w.unmount();
  mocks.get.mockResolvedValue(saved);
  w = await setup();
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.speech-toggle').trigger('click');
  expect(mocks.play.mock.calls.at(-1)![0].voice).toBe('voice-a');
  await w.get('.speech-settings').trigger('click');
  await flushPromises();
  expect((w.get('.voice-settings-content select').element as HTMLSelectElement).value).toBe(
    'voice-a',
  );
  await w.get('.voice-settings-content select').setValue('');
  await flushPromises();
  expect(mocks.play.mock.calls.at(-1)![0]).not.toHaveProperty('voice');
  expect(mocks.set.mock.calls.at(-1)![1].library[0]).not.toHaveProperty('speechVoice');
  w.unmount();
});

it('passes the import language and persists changes from article details for narration and analysis', async () => {
  mocks.importArticle.mockResolvedValue({ ...structuredClone(demo), language: 'en' });
  mocks.play.mockImplementation(() => ({
    finished: new Promise(() => {}),
    stop: vi.fn().mockResolvedValue(undefined),
  }));
  let w = await setup();
  await begin(w);
  await w.get('#article-language').setValue('en');
  await submit(w);
  expect(mocks.importArticle.mock.calls[0][6]).toBe('en');
  await w.get('.lingrove-bottom-tabs button:last-child').trigger('click');
  await w.get('.data-article > button').trigger('click');
  await w.get('#edit-language').setValue('zh');
  await w.get('.edit-sheet form').trigger('submit');
  await flushPromises();
  const saved = structuredClone(mocks.set.mock.calls.at(-1)![1]);
  expect(saved.library[0].reading.language).toBe('zh');
  w.unmount();
  mocks.get.mockResolvedValue(saved);
  w = await setup();
  await w.get('.article-open').trigger('click');
  await flushPromises();
  await w.get('.speech-toggle').trigger('click');
  expect(mocks.play.mock.calls.at(-1)![0].language).toBe('zh');
  await w.get('.sentence-trigger').trigger('keydown', { key: 'Enter', shiftKey: true });
  await w.get('.analyze-sentence').trigger('click');
  await flushPromises();
  expect(mocks.analyzeSentence.mock.calls.at(-1)![1].sourceLanguage).toBe('zh');
  w.unmount();
});

it('edits article metadata and tags, filters voices by language, and saves the selection', async () => {
  mocks.ttsStatus.mockResolvedValue({
    voices: [
      { id: 'ja-voice', title: '日语音色', language: 'ja' },
      { id: 'el-voice', title: '希腊音色', language: 'el' },
      { id: 'shared', title: '通用音色', language: '' },
    ],
  });
  let w = await setup();
  await begin(w);
  await submit(w);
  expect(w.findAll('#article-language option').map((o) => o.attributes('value'))).toEqual([
    'zh',
    'en',
    'ja',
    'ru',
    'el',
  ]);
  await w.get('.lingrove-bottom-tabs button:last-child').trigger('click');
  await w.get('.data-article > button').trigger('click');
  await flushPromises();
  expect(w.findAll('#edit-voice option').map((o) => o.attributes('value'))).toEqual([
    '',
    'ja-voice',
    'shared',
  ]);
  await w.get('#edit-voice').setValue('ja-voice');
  await w.get('#edit-language').setValue('el');
  expect((w.get('#edit-voice').element as HTMLSelectElement).value).toBe('');
  expect(w.findAll('#edit-voice option').map((o) => o.attributes('value'))).toEqual([
    '',
    'el-voice',
    'shared',
  ]);
  await w.get('#edit-article-title').setValue('新标题');
  await w.get('#edit-origin').setValue('书籍');
  await w.get('#edit-tags').setValue('旅行，学习,旅行');
  await w.get('#edit-voice').setValue('el-voice');
  await w.get('.edit-sheet form').trigger('submit');
  await flushPromises();
  const saved = structuredClone(mocks.set.mock.calls.at(-1)![1]);
  expect(saved.library[0]).toMatchObject({
    title: '新标题',
    origin: '书籍',
    tags: ['旅行', '学习'],
    speechVoice: 'el-voice',
    reading: { language: 'el' },
  });
  w.unmount();
  mocks.get.mockResolvedValue(saved);
  w = await setup();
  await w.get('.lingrove-bottom-tabs button:last-child').trigger('click');
  await w.get('.data-article > button').trigger('click');
  await flushPromises();
  expect((w.get('#edit-tags').element as HTMLInputElement).value).toBe('旅行，学习');
  expect((w.get('#edit-voice').element as HTMLSelectElement).value).toBe('el-voice');
  await w.get('#edit-article-title').setValue('未保存');
  await w.get('[aria-label="关闭文章编辑"]').trigger('click');
  expect(w.get('.data-article').text()).toContain('新标题');
  expect(w.get('.data-article').text()).not.toContain('未保存');
  w.unmount();
});
it('preserves the original article when rebuilding edited content fails', async () => {
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.lingrove-bottom-tabs button:last-child').trigger('click');
  await w.get('.data-article > button').trigger('click');
  await flushPromises();
  await w.get('#edit-source').setValue('変更した文章。');
  mocks.importArticle.mockRejectedValueOnce(new Error('连接失败'));
  await w.get('.edit-sheet form').trigger('submit');
  await flushPromises();
  expect(w.get('.edit-sheet .error').text()).toBe('连接失败');
  expect(mocks.set.mock.calls.at(-1)![1].library[0].source).toBe(demoSource);
  w.unmount();
});

it('rebuilds edited text and commits only after the new reading is ready', async () => {
  const w = await setup();
  await begin(w);
  await submit(w);
  await w.get('.lingrove-bottom-tabs button:last-child').trigger('click');
  await w.get('.data-article > button').trigger('click');
  await flushPromises();
  await w.get('#edit-language').setValue('en');
  await w.get('#edit-source').setValue('Hello!');
  let finish!: (value: unknown) => void;
  mocks.importArticle.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await w.get('.edit-sheet form').trigger('submit');
  expect(mocks.set.mock.calls.at(-1)![1].library[0].source).toBe(demoSource);
  expect(mocks.importArticle.mock.calls.at(-1)![6]).toBe('en');
  const { analyze } = await import('../src/api');
  const reading = await analyze('Hello!', 'en', new AbortController().signal, () => {});
  finish(reading);
  await flushPromises();
  expect(mocks.set.mock.calls.at(-1)![1].library[0]).toMatchObject({
    source: 'Hello!',
    reading,
    sentence: 0,
  });
  expect(w.get('.edit-sheet').attributes('open')).toBeUndefined();
  w.unmount();
});

it('shows loading only after sustained buffering and cancels stale loading timers', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  let onState!: (state: string) => void;
  mocks.play.mockImplementation((_input, options) => {
    onState = options.onState;
    return { finished: new Promise(() => {}), stop: vi.fn().mockResolvedValue(undefined) };
  });
  const w = await setup();
  try {
    await w.get('.empty button').trigger('click');
    await w.get('.speech-toggle').trigger('click');
    await vi.advanceTimersByTimeAsync(599);
    expect(w.find('.speech-spinner').exists()).toBe(false);
    onState('playing');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(100);
    expect(w.find('.speech-spinner').exists()).toBe(false);
    onState('buffering');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(600);
    expect(w.find('.speech-spinner').exists()).toBe(true);
    onState('playing');
    await flushPromises();
    expect(w.find('.speech-spinner').exists()).toBe(false);
    onState('buffering');
    await flushPromises();
    await w.get('.speech-toggle').trigger('click');
    await vi.advanceTimersByTimeAsync(1000);
    expect(w.find('.speech-spinner').exists()).toBe(false);
  } finally {
    w.unmount();
    vi.useRealTimers();
  }
});

it('jumps on taps during playback and pauses for long-press analysis without a release-click jump', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const calls: {
    pause: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }[] = [];
  mocks.play.mockImplementation((_input, options) => {
    const controls = {
      pause: vi.fn(async () => options.onState('paused')),
      resume: vi.fn(async () => options.onState('playing')),
      stop: vi.fn().mockResolvedValue(undefined),
    };
    calls.push(controls);
    options.onState('playing');
    return { ...controls, finished: new Promise(() => {}) };
  });
  mocks.importArticle.mockResolvedValue({
    ...structuredClone(demo),
    sentences: [...structuredClone(demo.sentences), ...structuredClone(demo.sentences)],
  });
  const w = await setup();
  try {
    await begin(w);
    await w.get('#source').setValue(demoSource + demoSource);
    await w.get('.import-sheet form').trigger('submit');
    await flushPromises();
    await w.get('.article-open').trigger('click');
    await flushPromises();
    await w.get('.speech-toggle').trigger('click');
    expect(w.get('.playback-hint').text()).toBe('点句子跳播，长按看解析');
    const sentences = w.findAll('.sentence-trigger');
    await sentences[0].trigger('click');
    expect(mocks.play).toHaveBeenCalledTimes(1);
    await sentences[1].trigger('click');
    expect(mocks.play).toHaveBeenCalledTimes(2);
    expect(calls[0].stop).toHaveBeenCalledOnce();
    expect(w.get('.analysis-sheet').attributes('open')).toBeUndefined();
    await sentences[0].trigger('pointerdown', {
      button: 0,
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    });
    await vi.advanceTimersByTimeAsync(500);
    await flushPromises();
    expect(calls[1].pause).toHaveBeenCalledOnce();
    expect(w.get('.analysis-sheet').attributes()).toHaveProperty('open');
    await sentences[0].trigger('pointerup');
    await sentences[0].trigger('click');
    expect(mocks.play).toHaveBeenCalledTimes(2);
    await w.get('[aria-label="关闭句子解析"]').trigger('click');
    await flushPromises();
    expect(calls[1].resume).toHaveBeenCalledOnce();
    await sentences[0].trigger('pointerdown', {
      button: 0,
      pointerId: 2,
      clientX: 10,
      clientY: 10,
    });
    await sentences[0].trigger('pointermove', { pointerId: 2, clientX: 10, clientY: 40 });
    await vi.advanceTimersByTimeAsync(600);
    await sentences[0].trigger('pointerup');
    await sentences[0].trigger('click');
    expect(w.get('.analysis-sheet').attributes('open')).toBeUndefined();
    expect(mocks.play).toHaveBeenCalledTimes(2);
    await sentences[0].trigger('keydown', { key: 'Enter', shiftKey: true });
    expect(w.get('.analysis-sheet').attributes()).toHaveProperty('open');
    await w.get('[aria-label="关闭句子解析"]').trigger('click');
    await flushPromises();
    await w.get('.speech-toggle').trigger('click');
    await w.get('.speech-toggle').trigger('click');
    expect(w.find('.playback-hint').exists()).toBe(false);
    expect(mocks.set.mock.calls.at(-1)![1].playbackHintSeen).toBe(true);
  } finally {
    w.unmount();
    vi.useRealTimers();
  }
});

it('suspends following after manual scroll, keeps highlighting, and restores it explicitly or on a jump', async () => {
  const scrollIntoView = vi.fn();
  const target = document.createElement('span');
  target.scrollIntoView = scrollIntoView;
  const lookup = vi.spyOn(document, 'getElementById').mockReturnValue(target);
  const calls: {
    emit: (state: string) => void;
    chunk: (index: number) => void;
    finish: () => void;
  }[] = [];
  mocks.play.mockImplementation((_input, options) => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    calls.push({ emit: options.onState, chunk: options.onChunk, finish });
    return {
      finished,
      stop: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(async () => options.onState('paused')),
      resume: vi.fn(async () => options.onState('playing')),
    };
  });
  mocks.importArticle.mockResolvedValue({
    ...structuredClone(demo),
    sentences: Array.from({ length: 3 }, () => structuredClone(demo.sentences)).flat(),
  });
  const w = mount(App, { attachTo: document.body });
  await flushPromises();
  try {
    await begin(w);
    await w.get('#source').setValue(demoSource.repeat(3));
    await w.get('.import-sheet form').trigger('submit');
    await flushPromises();
    await w.get('.article-open').trigger('click');
    await flushPromises();
    await w.get('.speech-toggle').trigger('click');
    calls[0].emit('playing');
    await flushPromises();
    scrollIntoView.mockClear();
    window.dispatchEvent(new Event('scroll'));
    await flushPromises();
    expect(w.find('.speech-return').exists()).toBe(false);
    window.dispatchEvent(new Event('touchmove'));
    await flushPromises();
    expect(w.get('.speech-return').text()).toBe('回到当前句');
    calls[0].chunk(1);
    calls[0].emit('playing');
    await flushPromises();
    expect(w.findAll('.sentence')[1].classes()).toContain('speaking');
    expect(scrollIntoView).not.toHaveBeenCalled();
    await w.get('.speech-return').trigger('click');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(lookup).toHaveBeenLastCalledWith('sentence-1');
    expect(w.find('.speech-return').exists()).toBe(false);
    scrollIntoView.mockClear();
    calls[0].chunk(2);
    calls[0].emit('playing');
    await flushPromises();
    expect(scrollIntoView).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('wheel'));
    await flushPromises();
    expect(w.find('.speech-return').exists()).toBe(true);
    await w.findAll('.sentence-trigger')[0].trigger('click');
    calls[1].emit('playing');
    await flushPromises();
    expect(w.find('.speech-return').exists()).toBe(false);
    expect(lookup).toHaveBeenLastCalledWith('sentence-0');
    await w.findAll('.sentence-trigger')[0].trigger('keydown', { key: 'Enter', shiftKey: true });
    window.dispatchEvent(new Event('wheel'));
    await flushPromises();
    expect(w.find('.speech-return').exists()).toBe(false);
    await w.get('[aria-label="关闭句子解析"]').trigger('click');
    await flushPromises();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
    await flushPromises();
    expect(w.find('.speech-return').exists()).toBe(true);
  } finally {
    w.unmount();
    lookup.mockRestore();
  }
});

describe('AI generation import', () => {
  async function openGenerator(w: Awaited<ReturnType<typeof setup>>) {
    await w.get('[aria-label="导入文章"]').trigger('click');
    await w.get('.import-menu button:last-child').trigger('click');
  }
  it('switches level systems, retains values across UI languages, and previews before importing', async () => {
    mocks.generateArticle.mockResolvedValue({
      title: 'A trip',
      source: 'We went to the park.',
      language: 'en',
    });
    const w = await setup();
    await openGenerator(w);
    expect(w.get('.generation-sheet').attributes()).toHaveProperty('open');
    expect(w.findAll('#generation-level option').map((o) => o.attributes('value'))).toEqual([
      'N5',
      'N4',
      'N3',
      'N2',
      'N1',
    ]);
    await w.get('#generation-language').setValue('zh');
    expect(w.findAll('#generation-level option').map((o) => o.attributes('value'))).toEqual([
      '初级',
      '中级',
      '高级',
    ]);
    await w.get('#generation-language').setValue('en');
    expect((w.get('#generation-level').element as HTMLSelectElement).value).toBe('A1');
    await w.get('#generation-level').setValue('B1');
    await w.get('#generation-language').setValue('ru');
    expect((w.get('#generation-level').element as HTMLSelectElement).value).toBe('B1');
    await w.get('#generation-language').setValue('en');
    await w.get('#generation-topic').setValue('custom');
    await w.get('#generation-custom-topic').setValue('A walk in the park');
    await w.get('#generation-length').setValue('500');
    await w.get('#generation-constraints').setValue('Use dialogue.');
    setAppLocale('en');
    await flushPromises();
    expect(w.get('#generation-title').text()).toBe('Generate an article');
    expect((w.get('#generation-level').element as HTMLSelectElement).value).toBe('B1');
    expect((w.get('#generation-custom-topic').element as HTMLInputElement).value).toBe(
      'A walk in the park',
    );
    setAppLocale('ja');
    await flushPromises();
    expect(w.get('#generation-title').text()).toBe('AI で文章を生成');
    setAppLocale('zh-Hans');
    await w.get('.generation-sheet form').trigger('submit');
    await flushPromises();
    expect(mocks.generateArticle.mock.calls[0][0]).toEqual({
      language: 'en',
      level: 'B1',
      topic: 'A walk in the park',
      length: 500,
      constraints: 'Use dialogue.',
    });
    expect(w.get('.generation-sheet').attributes('open')).toBeUndefined();
    expect(w.get('.import-sheet').attributes()).toHaveProperty('open');
    expect(w.get('#import-title').text()).toBe('预览生成文章');
    expect((w.get('#source').element as HTMLTextAreaElement).value).toBe('We went to the park.');
    expect(mocks.importArticle).not.toHaveBeenCalled();
    await w.get('#article-title').setValue('Edited title');
    await w.get('.import-sheet form').trigger('submit');
    await flushPromises();
    expect(mocks.importArticle.mock.calls[0][0]).toBe('We went to the park.');
    expect(mocks.importArticle.mock.calls[0][6]).toBe('en');
    expect(mocks.set.mock.calls.at(-1)![1].library[0]).toMatchObject({
      title: 'Edited title',
      origin: 'AI 生成',
    });
    w.unmount();
  });
  it('keeps inputs and existing drafts on failure, and ignores late results after close', async () => {
    const w = await setup();
    await begin(w);
    await w.get('#source').setValue('Existing draft');
    await w.get('[aria-label="关闭导入"]').trigger('click');
    await openGenerator(w);
    await w.get('#generation-constraints').setValue('Only present tense.');
    mocks.generateArticle.mockRejectedValueOnce(new Error('连接失败'));
    await w.get('.generation-sheet form').trigger('submit');
    await flushPromises();
    expect(w.get('.generation-sheet .error').text()).toBe('连接失败');
    expect((w.get('#source').element as HTMLTextAreaElement).value).toBe('Existing draft');
    let finish!: (value: unknown) => void;
    mocks.generateArticle.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await w.get('.generation-sheet form').trigger('submit');
    await w.get('.generation-sheet form').trigger('submit');
    expect(mocks.generateArticle).toHaveBeenCalledTimes(2);
    expect(w.get('#generation-language').attributes()).toHaveProperty('disabled');
    const signal = mocks.generateArticle.mock.calls[1][1].signal;
    await w.get('.generation-sheet').trigger('cancel');
    expect(signal.aborted).toBe(true);
    finish({ title: 'Late', source: 'Late text', language: 'ja' });
    await flushPromises();
    expect((w.get('#source').element as HTMLTextAreaElement).value).toBe('Existing draft');
    expect(w.get('.import-sheet').attributes('open')).toBeUndefined();
    await openGenerator(w);
    expect((w.get('#generation-constraints').element as HTMLTextAreaElement).value).toBe(
      'Only present tense.',
    );
    w.unmount();
  });
});

it('remembers generation choices across closing and restarting without requiring generation', async () => {
  let w = await setup();
  await w.get('[aria-label="导入文章"]').trigger('click');
  await w.get('.import-menu button:last-child').trigger('click');
  await w.get('#generation-language').setValue('ru');
  await w.get('#generation-level').setValue('C1');
  await w.get('#generation-topic').setValue('custom');
  await w.get('#generation-custom-topic').setValue('城市生活');
  await w.get('#generation-length').setValue('650');
  await w.get('[aria-label="关闭 AI 生成"]').trigger('click');
  await flushPromises();
  const saved = structuredClone(mocks.set.mock.calls.at(-1)![1]);
  expect(saved.generationPreferences).toEqual({
    language: 'ru',
    level: 'C1',
    topic: 'custom',
    customTopic: '城市生活',
    length: 650,
  });
  expect(mocks.generateArticle).not.toHaveBeenCalled();
  w.unmount();
  mocks.get.mockResolvedValue(saved);
  w = await setup();
  await w.get('[aria-label="导入文章"]').trigger('click');
  await w.get('.import-menu button:last-child').trigger('click');
  for (const [id, value] of Object.entries({
    language: 'ru',
    level: 'C1',
    topic: 'custom',
    'custom-topic': '城市生活',
    length: '650',
  })) {
    expect((w.get(`#generation-${id}`).element as HTMLInputElement).value).toBe(value);
  }
  await w.get('#generation-length').setValue('');
  await flushPromises();
  expect(mocks.set.mock.calls.at(-1)![1].generationPreferences.length).toBe(650);
  await w.get('#generation-language').setValue('ja');
  await w.get('#generation-length').setValue('200');
  await flushPromises();
  expect(mocks.set.mock.calls.at(-1)![1].generationPreferences).toMatchObject({
    language: 'ja',
    level: 'N5',
    length: 200,
  });
  w.unmount();
});
