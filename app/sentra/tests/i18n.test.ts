import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import {
  initializeAppLanguage,
  resolveAppLocale,
  setAppLocale,
  translate,
} from '../../../packages/host-sdk/src/i18n';
import App from '../src/App.vue';
import messages from '../src/locales/messages.json';

beforeEach(async () => {
  await initializeAppLanguage(messages);
  localStorage.clear();
  setAppLocale('zh-Hans');
});
afterEach(() => {
  setAppLocale('zh-Hans');
  vi.unstubAllGlobals();
});
describe('app language', () => {
  it('replaces child copy without leaking a previous catalog or losing SDK messages', async () => {
    await initializeAppLanguage({ '独立提示': { en: 'Child-only message', ja: '子アプリ専用' } });
    setAppLocale('en');
    expect(translate('独立提示')).toBe('Child-only message');
    expect(translate('模型服务返回错误')).toBe('Model service error');
    await initializeAppLanguage({});
    setAppLocale('en');
    expect(translate('独立提示')).toBe('独立提示');
    expect(translate('模型服务返回错误')).toBe('Model service error');
  });
  it.each([
    ['zh-CN', 'zh-Hans'],
    ['zh-TW', 'zh-Hans'],
    ['zh-Hant-HK', 'zh-Hans'],
    ['en-GB', 'en'],
    ['ja-JP', 'ja'],
    ['fr-FR', 'en'],
  ])('resolves %s to supported UI language %s', (input, output) => {
    expect(resolveAppLocale(input)).toBe(output);
  });
  it('updates an open page from the host event without losing input or changing select values', async () => {
    vi.stubGlobal('navigator', { language: 'zh-CN' });
    await initializeAppLanguage(messages);
    const page = mount(App);
    await flushPromises();
    await page.get('textarea').setValue('設定 — original user input');
    const emit = (language: string) =>
      window.dispatchEvent(new CustomEvent('lingrove:languagechange', { detail: { language } }));
    emit('en');
    await flushPromises();
    expect(page.get('textarea').attributes('aria-label')).toBe('Your sentence');
    expect(page.get('textarea').element.value).toBe('設定 — original user input');
    expect(page.get('select').element.value).toBe('英语');
    expect(page.get('select option').text()).toBe('English');
    expect(document.documentElement.lang).toBe('en');
    emit('ja');
    await flushPromises();
    expect(page.get('textarea').attributes('aria-label')).toBe('あなたの文');
    expect(page.get('select').element.value).toBe('英语');
    emit('zh-Hans');
    await flushPromises();
    expect(page.get('textarea').attributes('aria-label')).toBe('你的句子');
    page.unmount();
  });
  it('localizes variable messages and keeps arbitrary input intact', () => {
    setAppLocale('en');
    expect(translate('缺少API Key')).toBe('Missing API Key');
    expect(translate('关闭{0}', ['<user text>'])).toBe('Close <user text>');
    expect(translate('unlisted user sentence')).toBe('unlisted user sentence');
  });
});
