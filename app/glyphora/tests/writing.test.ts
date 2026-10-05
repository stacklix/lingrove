import { mount } from '@vue/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';
import WritingPad from '../src/components/WritingPad.vue';
import { eraseAt } from '../src/ink';
vi.mock('../src/render', () => ({ raster: vi.fn(), template: vi.fn() }));
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  } as any);
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 256,
    height: 256,
  } as DOMRect);
});
const pad = () =>
  mount(WritingPad, {
    props: {
      glyph: { id: 'ru-a', text: 'а', language: 'ru', group: 'lower', name: 'a', hint: '' },
      tracing: false,
    },
  });
async function draw(w: ReturnType<typeof pad>, pointerType: string) {
  for (const [event, x] of [
    ['pointerdown', 64],
    ['pointermove', 128],
    ['pointerup', 192],
  ] as const)
    await w.find('canvas').trigger(event, { pointerType, pointerId: 1, clientX: x, clientY: x });
}
it('writes and submits inline with a pen, ignores touch until enabled', async () => {
  const w = pad();
  const submit = w.find('button.primary');
  expect(w.text()).not.toContain('开始书写');
  await draw(w, 'touch');
  expect(submit.attributes('disabled')).toBeDefined();
  await draw(w, 'pen');
  await submit.trigger('click');
  expect(w.emitted('submit')![0][0]).toEqual([
    [
      { x: 0.25, y: 0.25 },
      { x: 0.5, y: 0.5 },
      { x: 0.75, y: 0.75 },
    ],
  ]);
  await w.findAll('button')[1].trigger('click');
  expect(submit.attributes('disabled')).toBeDefined();
  await w.find('input').setValue(true);
  await draw(w, 'touch');
  expect(submit.attributes('disabled')).toBeUndefined();
  w.unmount();
});
it('erases whole strokes and restores them with undo', async () => {
  const w = pad();
  await draw(w, 'pen');
  await w.findAll('button')[2].trigger('click');
  await draw(w, 'pen');
  expect(w.find('button.primary').attributes('disabled')).toBeDefined();
  await w.findAll('button')[0].trigger('click');
  expect(w.find('button.primary').attributes('disabled')).toBeUndefined();
  await w.setProps({ disabled: true });
  expect(w.find('button.primary').attributes('disabled')).toBeDefined();
  w.unmount();
});
it('erases between sparse samples while preserving distant strokes', () => {
  const strokes = [
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    [{ x: 0, y: 1 }],
  ];
  expect(eraseAt(strokes, { x: 0.5, y: 0.5 })).toEqual([strokes[1]]);
  expect(strokes).toHaveLength(2);
});
