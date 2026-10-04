import { JSDOM } from 'jsdom';
// Node 25 exposes its own Web Storage; DOM tests must use browser storage.
const browser = new JSDOM('', { url: 'https://glyphora.test/' });
for (const key of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, key, { configurable: true, value: browser.window[key] });
  Object.defineProperty(window, key, { configurable: true, value: browser.window[key] });
}
