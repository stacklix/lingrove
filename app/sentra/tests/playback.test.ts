import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { initializeAppLanguage, setAppLocale } from '../../../packages/host-sdk/src/i18n';
import ResultView from '../src/components/ResultView.vue';
import messages from '../src/locales/messages.json';

interface Request {
  id: string;
  text: string;
  language?: string;
  queue?: string[];
}
const requests: {
  params: Request;
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}[] = [];
let wrappers: VueWrapper[];
let configured: boolean;
let status: () => Promise<unknown>;
const post = vi.fn(async (message: { method: string; params: Request }) => {
  if (message.method === 'tts.status') return status();
  if (message.method === 'tts.play') {
    return new Promise((resolve, reject) =>
      requests.push({ params: message.params, resolve, reject }),
    );
  }
  if (message.method === 'tts.stop') {
    requests
      .find((request) => request.params.id === message.params.id)
      ?.reject(new DOMException('cancelled', 'AbortError'));
    return true;
  }
  throw new Error(`Unexpected method: ${message.method}`);
});
beforeEach(async () => {
  delete window.webkit;
  await initializeAppLanguage(messages);
  setAppLocale('zh-Hans');
  configured = true;
  status = async () => ({ configured });
  requests.length = 0;
  wrappers = [];
  post.mockClear();
  window.webkit = { messageHandlers: { lingrove: { postMessage: post } } };
});
afterEach(async () => {
  wrappers.forEach((wrapper) => wrapper.unmount());
  await flushPromises();
  delete window.webkit;
  setAppLocale('zh-Hans');
});
function page(extra: Record<string, unknown> = {}) {
  const wrapper = mount(ResultView, {
    props: {
      action: 'translate',
      data: reactive({
        translation_language: '英语',
        translations: [{ text: 'Hello.' }, { text: 'Hi there.' }],
        notes: [],
      }),
      ...extra,
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}
function event(index: number, state: string) {
  window.__lingroveChunk!(requests[index].params.id, JSON.stringify({ state }));
}
it('puts icon-only controls below each translation and restores them only after native completion', async () => {
  const wrapper = page();
  const buttons = wrapper.findAll('.translation-playback .translation-play-button');
  expect(buttons).toHaveLength(2);
  expect(wrapper.find('.card-top .translation-play-button').exists()).toBe(false);
  expect(buttons[0].text()).toBe('');
  expect(buttons[0].attributes('aria-label')).toBe('播放译文');
  expect(post).not.toHaveBeenCalled();
  await buttons[0].trigger('click');
  await flushPromises();
  expect(requests[0].params).toMatchObject({ text: 'Hello.', language: 'en' });
  expect(buttons[0].attributes('aria-label')).toBe('取消播放');
  event(0, 'playing');
  await flushPromises();
  expect(buttons[0].attributes('aria-label')).toBe('停止播放');
  expect(buttons[0].attributes('aria-pressed')).toBe('true');
  requests[0].resolve({ model: 'test', provider: 'test' });
  await flushPromises();
  expect(buttons[0].attributes('aria-label')).toBe('播放译文');
  expect(buttons[0].attributes('aria-pressed')).toBe('false');
});
it('stops the previous translation before starting another and ignores late events', async () => {
  const wrapper = page();
  const buttons = wrapper.findAll('.translation-play-button');
  await buttons[0].trigger('click');
  await flushPromises();
  event(0, 'playing');
  await buttons[1].trigger('click');
  await flushPromises();
  expect(post.mock.calls.map(([message]) => message.method)).toEqual([
    'tts.status',
    'tts.play',
    'tts.stop',
    'tts.status',
    'tts.play',
  ]);
  expect(requests[1].params.text).toBe('Hi there.');
  event(0, 'playing');
  event(1, 'playing');
  await flushPromises();
  expect(buttons[0].attributes('aria-pressed')).toBe('false');
  expect(buttons[1].attributes('aria-pressed')).toBe('true');
  await buttons[1].trigger('click');
  await flushPromises();
  expect(post.mock.calls.at(-1)?.[0].method).toBe('tts.stop');
  expect(wrapper.find('[role="alert"]').exists()).toBe(false);
});
it('cancels during preparation without starting playback after a late status response', async () => {
  let resolve!: (value: unknown) => void;
  status = () =>
    new Promise((done) => {
      resolve = done;
    });
  const wrapper = page();
  const button = wrapper.get('.translation-play-button');
  await button.trigger('click');
  await flushPromises();
  await button.trigger('click');
  resolve({ configured: true });
  await flushPromises();
  expect(requests).toHaveLength(0);
  expect(button.attributes('aria-label')).toBe('播放译文');
});
it('waits for an in-flight stop when translations are switched rapidly', async () => {
  const wrapper = page();
  const buttons = wrapper.findAll('.translation-play-button');
  await buttons[0].trigger('click');
  await flushPromises();
  const handler = post.getMockImplementation()!;
  let finishStop!: () => void;
  const stopped = new Promise<void>((resolve) => { finishStop = resolve; });
  post.mockImplementation(async (message) => {
    if (message.method === 'tts.stop') await stopped;
    return handler(message);
  });
  try {
    await buttons[1].trigger('click');
    await buttons[0].trigger('click');
    await flushPromises();
    expect(requests).toHaveLength(1);
    finishStop();
    await flushPromises();
    expect(requests).toHaveLength(2);
    expect(requests[1].params.text).toBe('Hello.');
  } finally {
    finishStop();
    post.mockImplementation(handler);
  }
});
it('shows a safe error on failure and can retry the same translation', async () => {
  const wrapper = page();
  const button = wrapper.get('.translation-play-button');
  await button.trigger('click');
  await flushPromises();
  requests[0].reject(new Error('private provider diagnostics'));
  await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toBe('播放失败，请点击重试。');
  expect(wrapper.text()).not.toContain('private provider diagnostics');
  expect(button.attributes('aria-label')).toBe('重试播放');
  await button.trigger('click');
  await flushPromises();
  expect(requests).toHaveLength(2);
  expect(wrapper.find('[role="alert"]').exists()).toBe(false);
});
it.each(['disabled', 'data', 'text', 'action', 'unmount'])(
  'stops playback when the result is no longer active: %s',
  async (change) => {
    const wrapper = page();
    await wrapper.get('.translation-play-button').trigger('click');
    await flushPromises();
    if (change === 'disabled') await wrapper.setProps({ playbackEnabled: false });
    if (change === 'data') await wrapper.setProps({ data: { translations: [{ text: 'New' }] } });
    if (change === 'text') wrapper.props('data').translations[0].text = 'Changed';
    if (change === 'action') await wrapper.setProps({ action: 'grammar' });
    if (change === 'unmount') wrapper.unmount();
    await flushPromises();
    expect(post.mock.calls.some(([message]) => message.method === 'tts.stop')).toBe(true);
  },
);
it('prevents playback of incomplete results and empty translations', async () => {
  const wrapper = page({ playbackEnabled: false });
  expect(
    wrapper
      .findAll('.translation-play-button')
      .every((button) => button.attributes('disabled') !== undefined),
  ).toBe(true);
  await wrapper.get('.translation-play-button').trigger('click');
  expect(post).not.toHaveBeenCalled();
  await wrapper.setProps({ playbackEnabled: true, data: { translations: [{ text: '  ' }, {}] } });
  expect(
    wrapper
      .findAll('.translation-play-button')
      .every((button) => button.attributes('disabled') !== undefined),
  ).toBe(true);
});
it('uses translated text without ruby readings and chunks long Unicode translations safely', async () => {
  const text = 'あ😀'.repeat(1500);
  const wrapper = page({
    data: {
      translation_language: '日语',
      translations: [{ text, ruby: [{ text: '学校', reading: 'がっこう' }] }],
    },
  });
  await wrapper.get('.translation-play-button').trigger('click');
  await flushPromises();
  const request = requests[0].params;
  expect(request.language).toBe('ja');
  expect(request.queue!.join('')).toBe(text);
  expect(request.text).toBe(request.queue![0]);
  expect(
    request.queue!.every((chunk) => chunk.length <= 4000 && !/[\uD800-\uDBFF]$/u.test(chunk)),
  ).toBe(true);
});
it('explains missing configuration and allows a retry after settings are fixed', async () => {
  configured = false;
  const wrapper = page();
  await wrapper.get('.translation-play-button').trigger('click');
  await flushPromises();
  expect(requests).toHaveLength(0);
  expect(wrapper.get('[role="alert"]').text()).toContain('应用设置 → 语音合成');
  configured = true;
  await wrapper.get('.translation-play-button').trigger('click');
  await flushPromises();
  expect(requests).toHaveLength(1);
});
it.each(['en', 'ja'])('localizes playback controls and browser guidance in %s', async (locale) => {
  delete window.webkit;
  setAppLocale(locale);
  const wrapper = page();
  const button = wrapper.get('.translation-play-button');
  expect(button.attributes('aria-label')).toBe(locale === 'en' ? 'Play translation' : '訳文を再生');
  await button.trigger('click');
  await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toBe(
    messages['请在 Lingrove 中播放译文。'][locale as 'en' | 'ja'],
  );
  expect(post).not.toHaveBeenCalled();
});
