import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import {
  initializeAppLanguage,
  resolveAppLocale,
  setAppLocale,
  translate,
} from '../../../packages/host-sdk/src/i18n';
import App from '../src/App.vue';

beforeEach(() => {
  localStorage.clear();
  setAppLocale('zh-Hans');
});
afterEach(() => {
  setAppLocale('zh-Hans');
  vi.unstubAllGlobals();
});
describe('app language', () => {
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
    await initializeAppLanguage();
    const page = mount(App);
    await flushPromises();
    await page.get('textarea').setValue('設定 — original user input');
    const emit = (language: string) =>
      window.dispatchEvent(new CustomEvent('lingrove:languagechange', { detail: { language } }));
    emit('en');
    await flushPromises();
    expect(page.get('label[for=sentence]').text()).toBe('Your sentence');
    expect(page.get('textarea').element.value).toBe('設定 — original user input');
    expect(page.get('select').element.value).toBe('英语');
    expect(page.get('select option').text()).toBe('English');
    expect(document.documentElement.lang).toBe('en');
    emit('ja');
    await flushPromises();
    expect(page.get('label[for=sentence]').text()).toBe('あなたの文');
    expect(page.get('select').element.value).toBe('英语');
    emit('zh-Hans');
    await flushPromises();
    expect(page.get('label[for=sentence]').text()).toBe('你的句子');
    page.unmount();
  });
  it('localizes variable messages and keeps arbitrary input intact', () => {
    setAppLocale('en');
    expect(translate('已显示 12 项，正在继续生成…')).toBe('12 entries shown, generating more…');
    expect(translate('查看{0} ↗', ['<user text>'])).toBe('View <user text> ↗');
    expect(translate('unlisted user sentence')).toBe('unlisted user sentence');
  });
});
