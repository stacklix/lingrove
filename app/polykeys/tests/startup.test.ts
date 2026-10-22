import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.vue';

vi.mock('@lingrove/host-sdk/vue', () => ({ useAppI18n: () => ({ t: (value: string) => value }) }));

const originalBridge = window.webkit;
let wrapper: VueWrapper | undefined;
afterEach(() => {
  wrapper?.unmount();
  window.webkit = originalBridge;
});

describe('native startup handshake', () => {
  it('sends runtime.ready and root navigation after mounting', async () => {
    const postMessage = vi.fn().mockResolvedValue(true);
    window.webkit = { messageHandlers: { lingrove: { postMessage } } };
    wrapper = mount(App);
    await flushPromises();
    expect(postMessage).toHaveBeenCalledWith({ version: 1, method: 'runtime.ready', params: {} });
    expect(postMessage).toHaveBeenCalledWith({ version: 1, method: 'runtime.navigation', params: { isRoot: true } });
    expect(postMessage).toHaveBeenCalledTimes(2);
  });

  it('shows an actionable message if the bridge rejects startup', async () => {
    window.webkit = { messageHandlers: { lingrove: { postMessage: vi.fn().mockRejectedValue(new Error('unavailable')) } } };
    wrapper = mount(App);
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe('打开失败，请返回后重试。');
  });
});
