import { expect, it } from 'vitest';
import { installFocusMode } from '../src/focus';
it('shows focus only after keyboard navigation and resets before pointer-driven dialogs', () => {
  const cleanup = installFocusMode();
  const root = document.documentElement;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
  expect(root.dataset.keyboardFocus).toBeUndefined();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
  expect(root.dataset.keyboardFocus).toBe('true');
  document.dispatchEvent(new Event('pointerdown'));
  expect(root.dataset.keyboardFocus).toBeUndefined();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  expect(root.dataset.keyboardFocus).toBe('true');
  cleanup();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
  expect(root.dataset.keyboardFocus).toBeUndefined();
});
