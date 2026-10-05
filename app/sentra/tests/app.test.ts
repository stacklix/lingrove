import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, it, expect, vi } from 'vitest';
import App from '../src/App.vue';
vi.mock('../src/api', () => ({
  analyze: vi.fn(async () => ({
    action: 'translate',
    data: {
      translations: [
        { text: 'Hello', type: 'direct' },
        { text: 'Hi', type: 'natural' },
      ],
      notes: [],
    },
    model: 'test',
    createdAt: new Date().toISOString(),
    schemaVersion: 3,
  })),
}));
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  delete window.webkit;
});
it('keeps independent tab drafts, saves results and reopens/deletes history', async () => {
  localStorage.setItem(
    'sentra.preferences.v2',
    JSON.stringify({ baseUrl: 'https://provider.test/v1', model: 'test' }),
  );
  const wrapper = mount(App);
  await flushPromises();
  await wrapper.get('textarea').setValue('你好');
  await wrapper.get('[data-action=grammar]').trigger('click');
  expect(wrapper.get('textarea').element.value).toBe('');
  expect(wrapper.get('button.primary').text()).toContain('分析语法');
  await wrapper.get('textarea').setValue('He go.');
  await wrapper.get('[data-action=translate]').trigger('click');
  expect(wrapper.get('textarea').element.value).toBe('你好');
  await wrapper.get('button.primary').trigger('click');
  await flushPromises();
  expect(wrapper.text()).toContain('Hello');
  expect(wrapper.get('button.primary').text()).toContain('重新翻译');
  expect(JSON.parse(localStorage.getItem('sentra.sentences.v1')!)).toHaveLength(1);
  await wrapper.get('[data-action=history]').trigger('click');
  expect(wrapper.findAll('.history-card')).toHaveLength(1);
  await wrapper.get('.history-open').trigger('click');
  expect(wrapper.get('textarea').element.value).toBe('你好');
  await wrapper.get('[data-action=history]').trigger('click');
  await wrapper.get('.danger').trigger('click');
  await flushPromises();
  expect(JSON.parse(localStorage.getItem('sentra.sentences.v1')!)).toHaveLength(0);
  wrapper.unmount();
});
it('does not overwrite corrupt existing history', async () => {
  localStorage.setItem('sentra.sentences.v1', 'corrupt');
  const wrapper = mount(App);
  await flushPromises();
  expect(wrapper.text()).toContain('已停止写入');
  expect(localStorage.getItem('sentra.sentences.v1')).toBe('corrupt');
  wrapper.unmount();
});

it('dismisses sheets without losing the learning draft', async () => {
  const wrapper = mount(App);
  await flushPromises();
  await wrapper.get('textarea').setValue('Keep this sentence');
  await wrapper.get('[data-action=settings]').trigger('click');
  await flushPromises();
  expect(wrapper.get('dialog').attributes('open')).toBeDefined();
  await wrapper.findAll('.settings select')[1].setValue('高级');
  await wrapper.get('.sheet-cancel').trigger('click');
  await flushPromises();
  expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
  expect(wrapper.get('textarea').element.value).toBe('Keep this sentence');
  await wrapper.get('[data-action=settings]').trigger('click');
  await flushPromises();
  expect(wrapper.findAll('.settings select')[1].element.value).not.toBe('高级');
  expect(wrapper.get('.sheet-save').attributes('form')).toBe(
    wrapper.get('.settings form').attributes('id'),
  );
  await wrapper.get('.sheet-cancel').trigger('click');
  await wrapper.get('[data-action=history]').trigger('click');
  await flushPromises();
  await wrapper.get('dialog').trigger('cancel');
  await flushPromises();
  expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
  expect(document.body.style.overflow).not.toBe('hidden');
  wrapper.unmount();
});

it('keeps model credentials out of child settings and saved preferences', async () => {
  localStorage.setItem(
    'sentra.preferences.v2',
    JSON.stringify({
      baseUrl: 'https://old.example',
      model: 'old',
      token: 'legacy-secret',
      level: '初级',
    }),
  );
  const wrapper = mount(App);
  await flushPromises();
  await wrapper.get('[data-action=settings]').trigger('click');
  await flushPromises();
  expect(wrapper.get('.settings').text()).not.toMatch(/模型|服务商|宿主设置/);
  expect(wrapper.find('input[type=password]').exists()).toBe(false);
  expect(wrapper.findAll('.settings input')).toHaveLength(0);
  await wrapper.get('.settings form').trigger('submit');
  await flushPromises();
  expect(JSON.parse(localStorage.getItem('sentra.preferences.v3')!)).toEqual({
    level: '初级',
    explanationLanguage: '简体中文',
    translationLanguage: '英语',
  });
  wrapper.unmount();
});

it('keeps the temporary translation language separate from the saved default', async () => {
  localStorage.setItem(
    'sentra.preferences.v2',
    JSON.stringify({
      baseUrl: 'https://provider.test/v1',
      model: 'test',
      translationLanguage: '英语',
    }),
  );
  let wrapper = mount(App);
  await flushPromises();
  await wrapper.get('.translation-language select').setValue('日语');
  await wrapper.get('textarea').setValue('你好');
  await wrapper.get('button.primary').trigger('click');
  await flushPromises();
  const { analyze } = await import('../src/api');
  expect(vi.mocked(analyze).mock.lastCall?.[2].translationLanguage).toBe('日语');
  await wrapper.get('[data-action=settings]').trigger('click');
  await flushPromises();
  const defaultLanguage = wrapper.findAll('.settings select').at(-1)!;
  expect(defaultLanguage.element.value).toBe('英语');
  await wrapper.get('.settings form').trigger('submit');
  await flushPromises();
  expect(wrapper.get('.translation-language select').element.value).toBe('日语');
  expect(JSON.parse(localStorage.getItem('sentra.preferences.v3')!).translationLanguage).toBe(
    '英语',
  );
  wrapper.unmount();
  wrapper = mount(App);
  await flushPromises();
  expect(wrapper.get('.translation-language select').element.value).toBe('英语');
  await wrapper.get('[data-action=settings]').trigger('click');
  await flushPromises();
  await wrapper.findAll('.settings select').at(-1)!.setValue('俄语');
  await wrapper.get('.settings form').trigger('submit');
  await flushPromises();
  expect(wrapper.get('.translation-language select').element.value).toBe('俄语');
  expect(JSON.parse(localStorage.getItem('sentra.preferences.v3')!).translationLanguage).toBe(
    '俄语',
  );
  wrapper.unmount();
});

it.each(['translate', 'grammar', 'improve'] as const)(
  'keyboard confirmation submits the current %s action and dismisses input',
  async (action) => {
    const { analyze } = await import('../src/api');
    vi.mocked(analyze).mockClear();
    const wrapper = mount(App, { attachTo: document.body });
    await flushPromises();
    await wrapper.get(`[data-action=${action}]`).trigger('click');
    const input = wrapper.get('textarea');
    input.element.focus();
    expect(input.attributes('enterkeyhint')).toBe('done');
    expect(wrapper.find('.keyboard-actions').exists()).toBe(false);
    await input.trigger('keydown', { key: 'Enter' });
    expect(vi.mocked(analyze)).not.toHaveBeenCalled();
    // An Enter used to select an IME candidate must not submit.
    await input.trigger('compositionstart');
    input.element.value = '你好，世界';
    await input.trigger('input');
    await input.trigger('keydown', { key: 'Enter', isComposing: true });
    expect(vi.mocked(analyze)).not.toHaveBeenCalled();
    await input.trigger('compositionend');
    await input.trigger('keydown', { key: 'Enter', keyCode: 229 });
    await input.trigger('keydown', { key: 'Enter', shiftKey: true });
    expect(vi.mocked(analyze)).not.toHaveBeenCalled();
    await input.trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(vi.mocked(analyze)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(analyze).mock.lastCall?.slice(0, 2)).toEqual([action, '你好，世界']);
    expect(document.activeElement).not.toBe(input.element);
    expect(wrapper.find('.keyboard-actions').exists()).toBe(false);
    wrapper.unmount();
  },
);

it('hides host navigation while a child sheet is open and restores it on close', async () => {
  const sdk = await import('@lingrove/host-sdk');
  const report = vi.spyOn(sdk, 'setRootPage').mockResolvedValue(undefined);
  const wrapper = mount(App);
  await flushPromises();
  expect(report).toHaveBeenLastCalledWith(true);
  await wrapper.get('[data-action=settings]').trigger('click');
  expect(report).toHaveBeenLastCalledWith(false);
  await wrapper.get('.sheet-cancel').trigger('click');
  expect(report).toHaveBeenLastCalledWith(true);
  await wrapper.get('[data-action=history]').trigger('click');
  expect(report).toHaveBeenLastCalledWith(false);
  wrapper.unmount();
  report.mockRestore();
});
