import { mount } from '@vue/test-utils';
import { beforeAll, expect, it, vi } from 'vitest';
import { setRootPage } from '@lingrove/host-sdk';
import SpecialVerbsSheet from '../src/components/SpecialVerbsSheet.vue';
vi.mock('@lingrove/host-sdk', () => ({ setRootPage: vi.fn().mockResolvedValue(undefined) }));
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});
it('searches kanji and readings, and restores the host and scrolling on dismiss', async () => {
  const wrapper = mount(SpecialVerbsSheet);
  document.body.style.overflow = 'auto';
  await wrapper.get('.special-verbs-toggle').trigger('click');
  expect(wrapper.get('dialog').attributes('open')).toBeDefined();
  expect(document.body.style.overflow).toBe('hidden');
  expect(setRootPage).toHaveBeenLastCalledWith(false);
  await wrapper.get('input').setValue('はしる');
  expect(wrapper.findAll('li').map((row) => row.text())).toEqual(['奔るはしる', '走るはしる']);
  await wrapper.get('input').setValue('帰');
  expect(wrapper.findAll('li')).toHaveLength(2);
  await wrapper.get('input').setValue('不存在');
  expect(wrapper.get('[role=status]').text()).toContain('未找到');
  await wrapper.get('dialog').trigger('cancel');
  expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
  expect(document.body.style.overflow).toBe('auto');
  expect(setRootPage).toHaveBeenLastCalledWith(true);
  await wrapper.get('.special-verbs-toggle').trigger('click');
  expect(wrapper.get('input').element.value).toBe('');
  wrapper.unmount();
  expect(document.body.style.overflow).toBe('auto');
  document.body.style.overflow = '';
});

it('keeps class sheets distinct and searches example meanings', async () => {
  const sahen = mount(SpecialVerbsSheet, { props: { kind: 'sahen' } });
  const kahen = mount(SpecialVerbsSheet, { props: { kind: 'kahen' } });
  expect(sahen.get('dialog').attributes('id')).not.toBe(kahen.get('dialog').attributes('id'));
  await sahen.get('button').trigger('click');
  expect(sahen.get('h2').text()).toBe('サ变动词词例');
  await sahen.get('input').setValue('学习');
  expect(sahen.findAll('li')).toHaveLength(1);
  expect(sahen.get('li').text()).toContain('勉強します');
  await sahen.get('dialog').trigger('cancel');
  await kahen.get('button').trigger('click');
  expect(kahen.text()).toContain('核心动词只有');
  await kahen.get('input').setValue('もってくる');
  expect(kahen.findAll('li')).toHaveLength(1);
  expect(kahen.get('li').text()).toContain('带来（物品）');
  expect(kahen.get('li').text()).toContain('もってきて');
  sahen.unmount();
  kahen.unmount();
  expect(document.body.style.overflow).toBe('');
});
