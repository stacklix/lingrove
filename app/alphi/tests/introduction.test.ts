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
      ...(intro.toneGuide
        ? [
            intro.toneGuide.introduction,
            intro.toneGuide.note,
            ...intro.toneGuide.tones.flatMap((tone) => [tone.meaning, tone.description]),
          ]
        : []),
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
  const wrapper = mount(LanguageIntroduction, { props: { language: 'vi' } });
  try {
    expect(wrapper.text()).toContain('发展历史');
    expect(wrapper.text()).toContain(introductions.vi.summary);
    expect(wrapper.findAll('.introduction-tone-list > div')).toHaveLength(6);
    expect(wrapper.text()).toContain('ắ 是 ă 加 sắc');
    for (const locale of ['en', 'ja'] as const) {
      setAppLocale(locale);
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain(
        messages[introductions.vi.summary as keyof typeof messages][locale],
      );
      expect(wrapper.text()).toContain(messages['六个声调'][locale]);
      expect(wrapper.text()).toContain(
        messages[introductions.vi.toneGuide!.tones[0].description as keyof typeof messages][locale],
      );
      expect(wrapper.text()).toContain(messages['发展历史'][locale]);
      expect(wrapper.get('h1').text()).toBe('Tiếng Việt');
      expect(wrapper.findAll('.introduction-sources a')).toHaveLength(
        introductions.vi.sources.length,
      );
    }
    await wrapper.setProps({ language: 'hy' });
    expect(wrapper.get('h1').text()).toBe('Հայերեն');
    expect(wrapper.find('.introduction-tones').exists()).toBe(false);
    expect(wrapper.text()).toContain(
      messages[introductions.hy.summary as keyof typeof messages].ja,
    );
  } finally {
    wrapper.unmount();
    setAppLocale('zh-Hans');
  }
});
