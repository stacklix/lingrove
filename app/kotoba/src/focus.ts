// Track actual navigation input: WebKit may retain :focus-visible after a dialog closes.
export function installFocusMode() {
  const root = document.documentElement;
  const onPointer = () => {
    delete root.dataset.keyboardFocus;
  };
  const onKey = (event: KeyboardEvent) => {
    if (
      ['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
    ) {
      root.dataset.keyboardFocus = 'true';
    }
  };
  document.addEventListener('pointerdown', onPointer, true);
  document.addEventListener('keydown', onKey, true);
  return () => {
    document.removeEventListener('pointerdown', onPointer, true);
    document.removeEventListener('keydown', onKey, true);
    delete root.dataset.keyboardFocus;
  };
}
