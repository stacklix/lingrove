import { flushPromises, mount } from '@vue/test-utils';
import { beforeAll, expect, it, vi } from 'vitest';
vi.mock('@lingrove/host-sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@lingrove/host-sdk')>()),
  ready: vi.fn().mockResolvedValue(undefined),
  setRootPage: vi.fn().mockResolvedValue(undefined),
  isNative: () => false,
}));
vi.mock('../src/api', () => ({ lookup: vi.fn() }));
import { lookup } from '../src/api';
import { demo } from '../src/demo';
import App from '../src/App.vue';
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});
it('groups educational forms under school grammar and toggles readings', async () => {
  const wrapper = mount(App);
  await wrapper.get('.search-footer button').trigger('click');
  expect(wrapper.get('[role=tabpanel]').text()).toContain('ない形');
  expect(wrapper.findAll('[role=tab]')).toHaveLength(6);
  expect(wrapper.findAll('[role=tabpanel]')).toHaveLength(1);
  expect(wrapper.find('.filters').exists()).toBe(false);
  expect(wrapper.findAll('.school-group')[0].text()).toContain('ない形');
  await wrapper.findAll('[role=tab]')[1].trigger('click');
  expect(wrapper.get('[role=tabpanel]').text()).toContain('ます形');
  expect(wrapper.get('[role=tabpanel]').text()).not.toContain('ない形');
  expect(wrapper.findAll('[role=tab]')[1].attributes('aria-selected')).toBe('true');
  await wrapper.findAll('[role=tab]')[1].trigger('keydown', { key: 'ArrowRight' });
  expect(wrapper.get('[role=tabpanel]').text()).toContain('终止形');
  await wrapper.get('input[type=checkbox]').setValue(false);
  expect(wrapper.find('.kana').exists()).toBe(false);
  wrapper.unmount();
});
it('queries a word, shows failures and retries successfully', async () => {
  vi.mocked(lookup).mockRejectedValueOnce(new Error('连接失败')).mockResolvedValueOnce(demo);
  const wrapper = mount(App);
  await wrapper.get('#word').setValue('食べる');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(wrapper.get('[role=alert]').text()).toContain('连接失败');
  await wrapper.get('[role=alert] button').trigger('click');
  await flushPromises();
  expect(wrapper.get('[role=tabpanel]').text()).toContain('ない形');
  expect(wrapper.find('[role=alert]').exists()).toBe(false);
  wrapper.unmount();
});
it('ignores a late response after cancel and switching to demo', async () => {
  let finish!: (value: typeof demo) => void;
  vi.mocked(lookup).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const wrapper = mount(App);
  await wrapper.get('#word').setValue('行く');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.find('.loading').exists()).toBe(true);
  await wrapper.get('.result-navigation button').trigger('click');
  expect(wrapper.get('#word').element.value).toBe('行く');
  await wrapper.get('.search-footer button').trigger('click');
  finish({ ...demo, word: '行く' });
  await flushPromises();
  expect(wrapper.get('.word-summary h2').text()).toBe('食べる');
  expect(wrapper.find('.loading').exists()).toBe(false);
  wrapper.unmount();
});

it('shows streamed entries immediately and retains them as partial if completion fails', async () => {
  let fail!: (error: Error) => void;
  vi.mocked(lookup).mockImplementationOnce((_word, _signal, progress) => {
    progress?.({ ...demo, forms: [demo.forms[0]] }, 600);
    return new Promise((_resolve, reject) => {
      fail = reject;
    });
  });
  const wrapper = mount(App);
  await wrapper.get('#word').setValue('食べる');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.findAll('.form-card')).toHaveLength(1);
  expect(wrapper.get('.loading').text()).toContain('已显示 1 项');
  expect(wrapper.get('.source').text()).toContain('部分结果');
  fail(new Error('连接中断'));
  await flushPromises();
  expect(wrapper.findAll('.form-card')).toHaveLength(1);
  expect(wrapper.get('[role=alert]').text()).toContain('连接中断');
  expect(wrapper.get('.source').text()).toContain('部分结果');
  wrapper.unmount();
});

it('opens results on a separate page and returns with the word preserved', async () => {
  vi.mocked(lookup).mockResolvedValueOnce(demo);
  const wrapper = mount(App);
  await wrapper.get('#word').setValue('食べる');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(wrapper.find('form').exists()).toBe(false);
  expect(wrapper.find('.intro').exists()).toBe(false);
  expect(wrapper.find('[role=tabpanel]').exists()).toBe(true);
  await wrapper.get('.result-navigation button').trigger('click');
  expect((wrapper.get('#word').element as HTMLInputElement).value).toBe('食べる');
  expect(wrapper.find('[role=tabpanel]').exists()).toBe(false);
  wrapper.unmount();
});

it('switches between query and offline grammar, preserving draft and topic', async () => {
  const wrapper = mount(App);
  await wrapper.get('#word').setValue('読む');
  const calls = vi.mocked(lookup).mock.calls.length;
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  expect(wrapper.find('.search-panel').exists()).toBe(false);
  expect(wrapper.get('.guide-content h2').text()).toBe('学校文法与教育文法');
  expect(wrapper.get('.guide-content').text()).toContain('不是一一对应的改名');
  expect(wrapper.findAll('.guide-stage > .grammar-level').map((item) => item.text())).toEqual([
    '01 · 文法基础',
    '02 · 词类',
    '03 · 敬语系统',
  ]);
  const titles = wrapper.findAll('.guide-topics button').map((button) => button.text());
  expect(titles).toContain('日语词类总览');
  expect(titles).toContain('敬语系统简介');
  expect(titles).toContain('动词活用');
  expect(titles).toContain('い形容词');
  expect(titles).toContain('な形容词');
  expect(titles.filter((title) => title === '格助词')).toHaveLength(1);
  expect(titles).not.toContain('连用形');
  expect(wrapper.findAll('.bottom-tabs button')[1].attributes('aria-current')).toBe('page');
  await wrapper.get('.directory-toggle').trigger('click');
  expect(wrapper.get('dialog').attributes('open')).toBeDefined();
  expect(document.body.style.overflow).toBe('hidden');
  await wrapper
    .findAll('.guide-topics button')
    .find((b) => b.text() === '动词活用')!
    .trigger('click');
  expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
  expect(document.body.style.overflow).not.toBe('hidden');
  await wrapper.get('[role=tablist]').findAll('button')[1].trigger('click');
  expect(wrapper.get('[role=tabpanel]').text()).toContain('行って・行った');
  await wrapper.findAll('.bottom-tabs button')[0].trigger('click');
  expect((wrapper.get('#word').element as HTMLInputElement).value).toBe('読む');
  expect(wrapper.find('.grammar-guide').exists()).toBe(false);
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  expect(wrapper.get('.guide-content h2').text()).toBe('动词活用');
  expect(wrapper.get('[role=tab][aria-selected=true]').text()).toBe('连用形');
  expect(vi.mocked(lookup).mock.calls.length).toBe(calls);
  wrapper.unmount();
});

it('closes the directory with Escape and when leaving the grammar page', async () => {
  const wrapper = mount(App);
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  await wrapper.get('.directory-toggle').trigger('click');
  expect(wrapper.get('.directory-toggle').attributes('aria-expanded')).toBe('true');
  await wrapper.get('dialog').trigger('cancel');
  expect(wrapper.get('.directory-toggle').attributes('aria-expanded')).toBe('false');
  await wrapper.get('.directory-toggle').trigger('click');
  await wrapper.findAll('.bottom-tabs button')[0].trigger('click');
  expect(document.body.style.overflow).not.toBe('hidden');
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
  wrapper.unmount();
});

it('groups construction rules by verb class within a single chapter', async () => {
  const wrapper = mount(App);
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  await wrapper.get('.directory-toggle').trigger('click');
  await wrapper
    .findAll('.guide-topics button')
    .find((button) => button.text() === '动词分类')!
    .trigger('click');
  expect(wrapper.get('.guide-content h2').text()).toBe('动词分类');
  expect(wrapper.findAll('.guide-group-title').map((item) => item.text())).toEqual([
    '五段动词 · Ⅰ类',
    '一段动词 · Ⅱ类',
    'サ变动词 · Ⅲ类',
    'カ变动词 · Ⅲ类',
  ]);
  const text = wrapper.get('.guide-content').text();
  expect(wrapper.findAll('.classification-details')).toHaveLength(4);
  expect(text).toContain('一段动词');
  expect(text).toContain('查词典的活用标记');
  await wrapper.get('.next-chapter').trigger('click');
  expect(wrapper.get('.guide-content h2').text()).toBe('动词活用');
  expect(wrapper.get('[role=tab][aria-selected=true]').text()).toBe('未然形');
  wrapper.unmount();
});

it('opens case-particle lessons from the grammar directory and preserves the selected lesson', async () => {
  const wrapper = mount(App);
  const tab = wrapper.findAll('.bottom-tabs button')[1];
  expect(tab.text()).toBe('语法手册');
  await tab.trigger('click');
  await wrapper.get('.directory-toggle').trigger('click');
  await wrapper
    .findAll('.guide-topics button')
    .find((button) => button.text() === '格助词')!
    .trigger('click');
  expect(wrapper.get('.guide-content h2').text()).toBe('格助词');
  await wrapper
    .findAll('.particle-filters button')
    .find((button) => button.text() === 'に')!
    .trigger('click');
  expect(wrapper.findAll('.grammar-sentence')).toHaveLength(4);
  expect(wrapper.get('.guide-content').text()).toContain('授業は九時に始まります。');
  expect(wrapper.get('.guide-content').text()).toContain('课九点开始。');
  expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
  await wrapper.findAll('.bottom-tabs button')[0].trigger('click');
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  expect(wrapper.get('.particle-filters button[aria-pressed=true]').text()).toBe('に');
  wrapper.unmount();
});

it('navigates conjugation tabs by keyboard and keeps adjective pages separate', async () => {
  const wrapper = mount(App, { attachTo: document.body });
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  const open = async (title: string) => {
    await wrapper.get('.directory-toggle').trigger('click');
    await wrapper
      .findAll('.guide-topics button')
      .find((button) => button.text() === title)!
      .trigger('click');
  };
  await open('动词活用');
  expect(wrapper.findAll('[role=tab]')).toHaveLength(6);
  expect(wrapper.findAll('[role=tabpanel]')).toHaveLength(1);
  await wrapper.get('[role=tab][aria-selected=true]').trigger('keydown', { key: 'End' });
  expect(wrapper.get('[role=tab][aria-selected=true]').text()).toBe('命令形');
  expect((document.activeElement as HTMLElement).textContent).toBe('命令形');
  expect(wrapper.get('[role=tabpanel]').attributes('aria-labelledby')).toBe('grammar-tab-meirei');
  await wrapper.get('[role=tab][aria-selected=true]').trigger('keydown', { key: 'ArrowRight' });
  expect(wrapper.get('[role=tab][aria-selected=true]').text()).toBe('未然形');
  await open('い形容词');
  expect(wrapper.findAll('.adjective-section')).toHaveLength(1);
  expect(wrapper.get('.adjective-section').text()).toContain('高い');
  expect(wrapper.get('.adjective-section').text()).not.toContain('静かだ');
  await open('な形容词');
  expect(wrapper.findAll('.adjective-section')).toHaveLength(1);
  expect(wrapper.get('.adjective-section').text()).toContain('静かだ');
  await open('敬语系统简介');
  expect(wrapper.get('.guide-content').text()).toContain('五类敬语');
  await open('谦让语Ⅱ（郑重语）');
  expect(wrapper.get('.guide-content').text()).toContain('田中と申します。');
  wrapper.unmount();
});

it('uses the selected language for both tabs and preserves separate word drafts', async () => {
  const wrapper = mount(App);
  await wrapper.get('#word').setValue('読む');
  await wrapper.get('select').setValue('el');
  expect(wrapper.get('#word').attributes('lang')).toBe('el');
  await wrapper.get('#word').setValue('καλός');
  expect(wrapper.findAll('.example-options button')).toHaveLength(3);
  await wrapper.findAll('.example-options button')[1].trigger('click');
  expect(wrapper.get('.word-summary h2').text()).toBe('καλός');
  expect(wrapper.findAll('[role=tab]')).toHaveLength(6);
  expect(wrapper.findAll('.form-card')).toHaveLength(4);
  expect(wrapper.find('.reading-toggle').exists()).toBe(false);
  expect(wrapper.find('.bottom-tabs').exists()).toBe(false);
  await wrapper.findAll('[role=tab]')[3].trigger('click');
  expect(wrapper.get('[role=tabpanel]').text()).toContain('καλών');
  await wrapper.get('.result-navigation button').trigger('click');
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  expect(wrapper.get('.guide-content h2').text()).toBe('词类与变形总览');
  await wrapper.get('.directory-toggle').trigger('click');
  await wrapper
    .findAll('.guide-topics button')
    .find((b) => b.text().includes('形容词'))!
    .trigger('click');
  expect(wrapper.get('.guide-content h2').text()).toBe('形容词：一致与比较');
  expect(wrapper.get('.grammar-mapping-table').text()).toContain('καλού');
  await wrapper.get('select').setValue('ja');
  expect(wrapper.get('.guide-content h2').text()).toBe('学校文法与教育文法');
  await wrapper.findAll('.bottom-tabs button')[0].trigger('click');
  expect(wrapper.get('#word').element.value).toBe('読む');
  await wrapper.get('select').setValue('el');
  expect(wrapper.get('#word').element.value).toBe('καλός');
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  expect(wrapper.get('.guide-content h2').text()).toBe('形容词：一致与比较');
  wrapper.unmount();
});

it('passes the handbook language to lookup and restores root navigation after returning', async () => {
  const { greekDemos } = await import('../src/greek-demos');
  const { setRootPage } = await import('@lingrove/host-sdk');
  vi.mocked(lookup).mockResolvedValueOnce(greekDemos[2]);
  const wrapper = mount(App);
  await flushPromises();
  await wrapper.get('select').setValue('el');
  await wrapper.get('#word').setValue('φίλου');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(lookup).toHaveBeenLastCalledWith(
    'φίλου',
    expect.any(AbortSignal),
    expect.any(Function),
    expect.any(Function),
    'el',
  );
  expect(setRootPage).toHaveBeenLastCalledWith(false);
  expect(wrapper.get('.word-summary h2').text()).toBe('φίλος');
  await wrapper.get('.result-navigation button').trigger('click');
  expect(setRootPage).toHaveBeenLastCalledWith(true);
  expect(wrapper.get('#word').element.value).toBe('φίλου');
  expect(wrapper.findAll('.bottom-tabs button')).toHaveLength(2);
  wrapper.unmount();
});

it('updates UI language without changing the handbook, draft or selected chapter', async () => {
  const { initializeAppLanguage, setAppLocale } =
    await import('../../../packages/host-sdk/src/i18n');
  const { default: messages } = await import('../src/locales/messages.json');
  await initializeAppLanguage(messages);
  setAppLocale('zh-Hans');
  const wrapper = mount(App);
  await flushPromises();
  try {
    await wrapper.get('select').setValue('el');
    await wrapper.get('#word').setValue('καλός');
    window.dispatchEvent(
      new CustomEvent('lingrove:languagechange', { detail: { language: 'en' } }),
    );
    await flushPromises();
    expect(wrapper.get('h1').text()).toBe('Inflection reference');
    expect(wrapper.get('select').element.value).toBe('el');
    expect(wrapper.get('#word').element.value).toBe('καλός');
    await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
    await wrapper.get('.directory-toggle').trigger('click');
    await wrapper
      .findAll('.guide-topics button')
      .find((b) => b.text().includes('Adjectives'))!
      .trigger('click');
    window.dispatchEvent(
      new CustomEvent('lingrove:languagechange', { detail: { language: 'ja' } }),
    );
    await flushPromises();
    expect(wrapper.get('.guide-content h2').text()).toBe('形容詞：一致と比較');
    expect(wrapper.get('select').element.value).toBe('el');
    expect(wrapper.get('.grammar-mapping-table').text()).toContain('καλού');
  } finally {
    wrapper.unmount();
    setAppLocale('zh-Hans');
  }
});
