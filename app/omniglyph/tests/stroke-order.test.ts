import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { glyphs } from '../src/curriculum';
import { greekPaths } from '../src/greek-paths';
import { russianPaths } from '../src/russian-paths';
import { strokeSteps } from '../src/stroke-order';
import StrokeOrder from '../src/components/StrokeOrder.vue';

const greek = glyphs.filter((g) => g.language === 'el');
const glyph = (text: string) => greek.find((g) => g.text === text)!;
const mountOrder = (text: string, autoplay = false) =>
  mount(StrokeOrder, {
    props: { glyph: glyph(text), autoplay },
    global: { stubs: { PronunciationButton: true } },
  });
afterEach(() => vi.useRealTimers());

it('covers all 49 Greek forms with continuous strokes and matching instructions', () => {
  expect(greek).toHaveLength(49);
  expect(Object.keys(greekPaths).sort()).toEqual(greek.map((g) => g.text).sort());
  for (const g of greek) {
    const paths = greekPaths[g.text];
    expect(paths.length).toBeGreaterThan(0);
    expect(strokeSteps(g)).toHaveLength(paths.length);
    for (const path of paths) {
      expect(path).toMatch(/^M\d+ \d+ /);
      expect(path.match(/M/g)).toHaveLength(1);
      expect(path).not.toMatch(/NaN|undefined|Infinity/);
    }
  }
});

it('supports stepping, autoplay completion, replay, pause and case changes', async () => {
  vi.useFakeTimers();
  const w = mountOrder('π', true);
  const controls = () => w.findAll('.order-controls button');
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('π 第 1 笔');
  expect(controls()[1].attributes('disabled')).toBeDefined();
  await vi.advanceTimersByTimeAsync(1800);
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('π 第 2 笔');
  await vi.advanceTimersByTimeAsync(3600);
  expect(controls()[0].text()).toBe('播放');
  expect(controls()[2].attributes('disabled')).toBeDefined();
  await controls()[0].trigger('click');
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('π 第 1 笔');
  await controls()[0].trigger('click');
  await vi.advanceTimersByTimeAsync(3600);
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('π 第 1 笔');
  await controls()[2].trigger('click');
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('π 第 2 笔');
  await controls()[1].trigger('click');
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('π 第 1 笔');
  await w.setProps({ glyph: glyph('Ξ') });
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('Ξ 第 1 笔');
  expect(controls()[0].text()).toBe('播放');
  await w.findAll('.stroke-steps button')[2].trigger('click');
  expect(w.get('.order-canvas').attributes('aria-label')).toBe('Ξ 第 3 笔');
  await w.setProps({ glyph: glyph('ς') });
  expect(w.findAll('.stroke-steps li')).toHaveLength(1);
  expect(controls()[1].attributes('disabled')).toBeDefined();
  expect(controls()[2].attributes('disabled')).toBeDefined();
  await controls()[0].trigger('click');
  await vi.advanceTimersByTimeAsync(1800);
  expect(controls()[0].text()).toBe('播放');
  await controls()[0].trigger('click');
  w.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps Greek references and scoring in the font, with separate animated stroke guides', async () => {
  const { default: GlyphView } = await import('../src/components/GlyphView.vue');
  const { template } = await import('../src/render');
  const stroke = vi.fn();
  const fillText = vi.fn();
  const context = {
    font: '',
    stroke,
    fillText,
    measureText: () => ({
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 100,
      actualBoundingBoxAscent: 130,
      actualBoundingBoxDescent: 20,
    }),
  };
  const canvas = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(context as unknown as CanvasRenderingContext2D);
  try {
    for (const g of greek) {
      expect(g.paths).toBeUndefined();
      const reference = mount(GlyphView, { props: { glyph: g } });
      const animation = mountOrder(g.text);
      expect(reference.get('.handwritten').text()).toBe(g.text);
      expect(reference.get('.handwritten').attributes('style')).toContain('Playpen Sans');
      expect(animation.find('mask').exists()).toBe(false);
      expect(
        animation
          .findAll('.order-canvas path')
          .slice(0, -1)
          .map((p) => p.attributes('d')),
      ).toEqual(greekPaths[g.text]);
      fillText.mockClear();
      template(g);
      expect(context.font).toBe('170px Playpen Sans');
      expect(fillText).toHaveBeenCalledWith(g.text, expect.any(Number), expect.any(Number));
      reference.unmount();
      animation.unmount();
    }
    expect(stroke).not.toHaveBeenCalled();
  } finally {
    canvas.mockRestore();
  }
});

it('has one pen-down trajectory and one instruction per Russian or Greek animation step', () => {
  for (const g of glyphs.filter((g) => g.language !== 'ja')) {
    const paths = (g.language === 'ru' ? russianPaths : greekPaths)[g.text];
    expect(paths.length).toBeGreaterThan(0);
    expect(strokeSteps(g)).toHaveLength(paths.length);
    for (const path of paths) expect(path.match(/[Mm]/g)).toHaveLength(1);
  }
});

it.each([
  ['Е', 4],
  ['Ё', 6],
  ['Н', 3],
  ['ж', 3],
] as const)('plays each separate stroke of Russian %s in sequence', async (text, count) => {
  vi.useFakeTimers();
  const g = glyphs.find((g) => g.language === 'ru' && g.text === text)!;
  const w = mount(StrokeOrder, { props: { glyph: g, autoplay: true } });
  await vi.advanceTimersByTimeAsync(0);
  expect(w.findAll('.stroke-steps li')).toHaveLength(count);
  for (let i = 0; i < count; i++) {
    expect(w.findAll('.order-active')).toHaveLength(1);
    expect(w.get('.order-active').attributes('d')).toBe(russianPaths[text][i]);
    const strokes = w.findAll('.order-canvas path').slice(0, -1);
    expect(strokes.filter((p) => p.attributes('opacity') === '1')).toHaveLength(i);
    expect(w.get('.order-canvas').attributes('aria-label')).toBe(`${text} 第 ${i + 1} 笔`);
    await vi.advanceTimersByTimeAsync(1800);
  }
  expect(w.findAll('.order-controls button')[0].text()).toBe('播放');
  w.unmount();
});
