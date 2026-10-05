import { flushPromises, mount } from '@vue/test-utils';
import { beforeAll, expect, it, vi } from 'vitest';
vi.mock('@lingrove/host-sdk', () => ({
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
    '02 · 动词活用规则',
    '03 · 形容词活用规则',
  ]);
  expect(wrapper.findAll('.guide-topics button').map((b) => b.text())).toEqual([
    '学校文法与教育文法',
    '动词分类',
    '未然形',
    '连用形',
    '终止形',
    '连体形',
    '假定形',
    '命令形',
    '形容词',
  ]);
  expect(wrapper.findAll('.bottom-tabs button')[1].attributes('aria-current')).toBe('page');
  await wrapper.get('.directory-toggle').trigger('click');
  expect(wrapper.get('dialog').attributes('open')).toBeDefined();
  expect(document.body.style.overflow).toBe('hidden');
  await wrapper
    .findAll('.guide-topics button')
    .find((b) => b.text() === '连用形')!
    .trigger('click');
  expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
  expect(document.body.style.overflow).not.toBe('hidden');
  expect(wrapper.get('.guide-content').text()).toContain('行って・行った');
  await wrapper.findAll('.bottom-tabs button')[0].trigger('click');
  expect((wrapper.get('#word').element as HTMLInputElement).value).toBe('読む');
  expect(wrapper.find('.grammar-guide').exists()).toBe(false);
  await wrapper.findAll('.bottom-tabs button')[1].trigger('click');
  expect(wrapper.get('.guide-content h2').text()).toBe('连用形');
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
  await wrapper.get('.next-chapter').trigger('click');
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
  expect(wrapper.get('.guide-content h2').text()).toBe('未然形');
  wrapper.unmount();
});
