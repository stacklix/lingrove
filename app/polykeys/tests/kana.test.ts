import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import KanaKeyboard from '../src/KanaKeyboard.vue';
import { flickIndex, kanaVariant } from '../src/kana';

vi.mock('@lingrove/host-sdk/vue', () => ({ useAppI18n: () => ({ t: (value: string) => value }) }));

describe('kana flick input', () => {
  it('recognizes taps and all four directions with a movement threshold', () => {
    expect([[0, 0], [-10, 8], [-30, 5], [5, -30], [30, 5], [5, 30]].map(([x, y]) => flickIndex(x, y))).toEqual([0, 0, 1, 2, 3, 4]);
  });
  it('cycles voiced, semi-voiced and small kana in both scripts', () => {
    expect(['は', 'ば', 'ぱ', 'つ', 'づ', 'っ', 'う', 'ゔ', 'ぅ', 'ヤ', 'ャ', 'あ', 'ぁ', 'ん'].map(kanaVariant))
      .toEqual(['ば', 'ぱ', 'は', 'づ', 'っ', 'つ', 'ゔ', 'ぅ', 'う', 'ャ', 'ヤ', 'ぁ', 'あ', 'ん']);
  });
  it('supports keyboard selection, empty directions and katakana', async () => {
    const wrapper = mount(KanaKeyboard, { props: { katakana: false } });
    const keys = wrapper.findAll('.kana-key');
    await keys[0].trigger('click');
    for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) await keys[0].trigger('keydown', { key });
    await keys[7].trigger('keydown', { key: 'ArrowLeft' });
    expect(wrapper.emitted('input')).toEqual([['あ'], ['い'], ['う'], ['え'], ['お']]);
    await wrapper.setProps({ katakana: true });
    await keys[1].trigger('keydown', { key: 'ArrowUp' });
    expect(wrapper.emitted('input')?.at(-1)).toEqual(['ク']);
  });
  it('emits once on pointer release and ignores cancelled gestures', async () => {
    const wrapper = mount(KanaKeyboard, { props: { katakana: false } });
    const key = wrapper.findAll('.kana-key')[1];
    key.element.setPointerCapture = vi.fn();
    const pointer = { pointerId: 1, isPrimary: true, button: 0, clientX: 50, clientY: 50 };
    await key.trigger('pointerdown', pointer);
    await key.trigger('pointermove', { ...pointer, clientX: 20 });
    await key.trigger('pointerup', { ...pointer, clientX: 20 });
    key.element.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
    expect(wrapper.emitted('input')).toEqual([['き']]);
    await key.trigger('pointerdown', pointer);
    await key.trigger('pointercancel', pointer);
    await key.trigger('pointerup', pointer);
    expect(wrapper.emitted('input')).toHaveLength(1);
    await key.trigger('pointerdown', pointer);
    await key.trigger('pointerup', pointer);
    expect(wrapper.emitted('input')?.at(-1)).toEqual(['か']);
  });
});
