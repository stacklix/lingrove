import { getAppLanguage } from './index';
import messages from './locales/messages.json';

export type AppMessages = Record<string, { en: string; ja: string }>;
let catalog: AppMessages = messages;
let patterns = createPatterns(catalog);

export type AppLocale = 'zh-Hans' | 'en' | 'ja';
export const appLocales: AppLocale[] = ['zh-Hans', 'en', 'ja'];
export function resolveAppLocale(language: string): AppLocale {
  const code = language.toLowerCase().replace(/_/g, '-');
  if (code === 'zh' || code.startsWith('zh-')) {
    return 'zh-Hans';
  }
  return code === 'ja' || code.startsWith('ja-') ? 'ja' : 'en';
}
let locale: AppLocale = 'zh-Hans';
const listeners = new Set<() => void>();
let pageTitle: string | undefined;
export const currentAppLocale = () => locale;
export function setAppLocale(language: string): void {
  const next = resolveAppLocale(language);
  document.documentElement.lang = next;
  const changed = next !== locale;
  locale = next;
  pageTitle ??= document.title;
  document.title = translate(pageTitle);
  if (!changed) return;
  listeners.forEach((listener) => listener());
}
export function onAppLocaleChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
let initialized = false;
export async function initializeAppLanguage(appMessages: AppMessages): Promise<void> {
  // Each child supplies its own bundled copy. The SDK owns only API-level messages.
  catalog = { ...messages, ...appMessages };
  patterns = createPatterns(catalog);
  if (!initialized) {
    initialized = true;
    window.addEventListener('lingrove:languagechange', (event) => {
      const language = (event as CustomEvent<{ language: string }>).detail?.language;
      if (typeof language === 'string') setAppLocale(language);
    });
    window.addEventListener('languagechange', () => {
      void getAppLanguage()
        .then(setAppLocale)
        .catch(() => {});
    });
  }
  setAppLocale(await getAppLanguage());
}
function createPatterns(source: AppMessages) {
  return Object.entries(source)
    .filter(([key]) => /\{\d+\}/.test(key))
    .map(([key, value]) => ({
      pattern: new RegExp(
        '^' +
          key
            .split(/(\{\d+\})/)
            .map((part) =>
              /^\{\d+\}$/.test(part) ? '([\\s\\S]*?)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            )
            .join('') +
          '$',
      ),
      value,
    }));
}
/** Only use for application copy. User input and generated/stored learning content are not translated. */
export function translate(value: unknown, values: readonly unknown[] = []): string {
  const source = value == null ? '' : String(value);
  const selected = catalog[source];
  let result = locale === 'zh-Hans' ? source : selected?.[locale];
  let args = values;
  if (result === undefined && locale !== 'zh-Hans') {
    for (const entry of patterns) {
      const match = entry.pattern.exec(source);
      if (match) {
        result = entry.value[locale];
        args = match.slice(1);
        break;
      }
    }
  }
  return (result ?? source).replace(/\{(\d+)\}/g, (placeholder, index) =>
    index in args ? String(args[Number(index)] ?? '') : placeholder,
  );
}
