import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VietnameseKey from '../src/VietnameseKey.vue';

vi.mock('@lingrove/host-sdk/vue', () => ({ useAppI18n: () => ({ t: (value: string) => value }) }));
let wrapper: VueWrapper | undefined;
beforeEach(() => vi.useFakeTimers());
afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.useRealTimers(); });
const pointer = { pointerId: 1, isPrimary: true, button: 0, clientX: 110, clientY: 520 };
const rect = (left: number, top: number, width = 40, height = 44) => ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON() {} });
function setup(value = 'a') {
  wrapper = mount(VietnameseKey, { props: { value }, attachTo: document.body });
  const key = wrapper.get('button');
  key.element.setPointerCapture = vi.fn();
  key.element.getBoundingClientRect = () => rect(100, 500);
  return key;
}
describe('Vietnamese press-and-hold keys', () => {
  it('inserts one ordinary character for a short tap and suppresses its follow-up click', async () => {
    const key = setup();
    await key.trigger('pointerdown', pointer);
    await vi.advanceTimersByTimeAsync(200);
    await key.trigger('pointerup', pointer);
    key.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(wrapper!.emitted('input')).toEqual([['a']]);
    expect(document.querySelector('.vietnamese-variants')).toBeNull();
  });
  it('opens after holding, selects by sliding, and inserts only the chosen variant', async () => {
    const key = setup();
    await key.trigger('pointerdown', pointer);
    await vi.advanceTimersByTimeAsync(400);
    const panel = document.querySelector('.vietnamese-variants')!;
    const options = [...panel.querySelectorAll('button')];
    expect(options).toHaveLength(18);
    options.forEach((button, index) => { button.getBoundingClientRect = () => rect(8 + index % 6 * 44, 340 + Math.floor(index / 6) * 48); });
    const option = options.find(button => button.textContent === 'ấ')!;
    const bounds = option.getBoundingClientRect();
    const choice = { ...pointer, clientX: bounds.left + 10, clientY: bounds.top + 10 };
    await key.trigger('pointermove', choice);
    await key.trigger('pointerup', choice);
    expect(wrapper!.emitted('literal')).toEqual([['ấ']]);
    expect(wrapper!.emitted('input')).toBeUndefined();
    expect(document.querySelector('.vietnamese-variants')).toBeNull();
  });
  it('cancels pointer gestures, early drags and changing case without inserting text', async () => {
    const key = setup();
    await key.trigger('pointerdown', pointer);
    await key.trigger('pointercancel', pointer);
    await vi.advanceTimersByTimeAsync(500);
    await key.trigger('pointerup', pointer);
    await key.trigger('pointerdown', pointer);
    await key.trigger('pointermove', { ...pointer, clientX: 160 });
    await vi.advanceTimersByTimeAsync(500);
    await key.trigger('pointerup', pointer);
    await key.trigger('pointerdown', pointer);
    await vi.advanceTimersByTimeAsync(400);
    await wrapper!.setProps({ value: 'A' });
    await key.trigger('pointerup', pointer);
    expect(wrapper!.emitted()).not.toHaveProperty('input');
    expect(wrapper!.emitted()).not.toHaveProperty('literal');
    expect(document.querySelector('.vietnamese-variants')).toBeNull();
  });
  it('supports keyboard selection, Escape and uppercase variants', async () => {
    const key = setup('A');
    await key.trigger('keydown', { key: 'ArrowDown' });
    const panel = document.querySelector('.vietnamese-variants')!;
    expect(document.activeElement?.textContent).toBe('A');
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement?.textContent).toBe('Ă');
    (document.activeElement as HTMLButtonElement).click();
    await wrapper!.vm.$nextTick();
    expect(wrapper!.emitted('literal')).toEqual([['Ă']]);
    await key.trigger('keydown', { key: 'ArrowDown' });
    document.querySelector('.vietnamese-variants')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wrapper!.vm.$nextTick();
    expect(document.querySelector('.vietnamese-variants')).toBeNull();
    expect(document.activeElement).toBe(key.element);
  });
});
