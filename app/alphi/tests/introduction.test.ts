import { mount } from '@vue/test-utils';
import { beforeEach, expect, it } from 'vitest';
import { initializeAppLanguage } from '@lingrove/host-sdk';
import { setAppLocale } from '../../../packages/host-sdk/src/i18n';
import { languages } from '../src/curriculum';
import { introductions } from '../src/language-introductions';
import messages from '../src/locales/messages.json';
import LanguageIntroduction from '../src/components/LanguageIntroduction.vue';

beforeEach(async () => {
  await initializeAppLanguage(messages);
  setAppLocale('zh-Hans');
});

it('provides sourced, fully translated introductions for every language', () => {
  for (const { id } of languages) {
    const intro = introductions[id];
    expect(intro.nativeName).toBeTruthy();
    expect(intro.history.length).toBeGreaterThanOrEqual(3);
    expect(intro.sources.length).toBeGreaterThanOrEqual(2);
    for (const source of intro.sources) expect(new URL(source.url).protocol).toBe('https:');
    const content = [
      intro.summary,
      ...Object.values(intro.facts),
      intro.writingNote,
      intro.tip,
      ...intro.history.flatMap((event) => [event.period, event.title, event.description]),
    ];
    for (const key of content) {
      const translated = messages[key as keyof typeof messages];
      expect(translated?.en, key).toBeTruthy();
      expect(translated?.ja, key).toBeTruthy();
    }
  }
});

it('updates an open introduction when the app language changes', async () => {
  const wrapper = mount(LanguageIntroduction, { props: { language: 'ko' } });
  try {
    expect(wrapper.text()).toContain('发展历史');
    expect(wrapper.text()).toContain(introductions.ko.summary);
    for (const locale of ['en', 'ja'] as const) {
      setAppLocale(locale);
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain(
        messages[introductions.ko.summary as keyof typeof messages][locale],
      );
      expect(wrapper.text()).toContain(messages['发展历史'][locale]);
      expect(wrapper.get('h1').text()).toBe('한국어');
      expect(wrapper.findAll('.introduction-sources a')).toHaveLength(
        introductions.ko.sources.length,
      );
    }
    await wrapper.setProps({ language: 'hy' });
    expect(wrapper.get('h1').text()).toBe('Հայերեն');
    expect(wrapper.text()).toContain(
      messages[introductions.hy.summary as keyof typeof messages].ja,
    );
  } finally {
    wrapper.unmount();
    setAppLocale('zh-Hans');
  }
});
