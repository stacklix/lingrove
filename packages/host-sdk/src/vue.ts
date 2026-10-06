import { onUnmounted, ref } from 'vue';
import { currentAppLocale, onAppLocaleChange, translate } from './i18n';
export function useAppI18n() {
  const locale = ref(currentAppLocale());
  const unsubscribe = onAppLocaleChange(() => {
    locale.value = currentAppLocale();
  });
  onUnmounted(unsubscribe);
  return {
    locale,
    t: (value: unknown, values?: readonly unknown[]) => {
      void locale.value;
      return translate(value, values);
    },
  };
}
