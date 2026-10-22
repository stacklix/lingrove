import { expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { grammarTopics, grammarLessons } from '../src/grammar';
import GrammarExample from '../src/components/GrammarExample.vue';
import messages from '../src/locales/messages.json';

it('provides complete sentences and translated meanings for every inflection and usage', () => {
  const entries = grammarLessons.flatMap((topic) => [
    ...(topic.conjugations ?? []),
    ...(topic.conjugations ? topic.rules : []),
    ...(topic.sections ?? []).flatMap((section) => [
      ...section.forms.filter((form) => form.example !== '—'),
      ...section.usages,
    ]),
  ]);
  expect(entries.length).toBeGreaterThan(60);
  for (const entry of entries) {
    expect(entry.sentence, entry.name).toBeDefined();
    expect(entry.sentence!.japanese).toMatch(/[。！]$/);
    const translation = messages[entry.sentence!.translation as keyof typeof messages];
    expect(translation.en).toBeTruthy();
    expect(translation.ja).toBe(entry.sentence!.japanese);
  }
  for (const section of grammarTopics
    .filter((topic) => topic.group === '形容词')
    .flatMap((topic) => topic.sections ?? [])) {
    expect(section.forms.find((form) => form.name === '命令形')!.sentence).toBeUndefined();
  }
});

it('renders Japanese and its meaning as separate paragraphs', () => {
  const sentence = grammarLessons.find((topic) => topic.id === 'mizen')!.rules[0].sentence!;
  const wrapper = mount(GrammarExample, { props: { sentence } });
  expect(wrapper.get('[lang="ja"]').text()).toBe(sentence.japanese);
  expect(wrapper.get('.grammar-sentence-translation').text()).toBe(sentence.translation);
  wrapper.unmount();
});

it('covers nine common case particles with translated explanations and complete example sentences', () => {
  const topics = grammarTopics.find((topic) => topic.id === 'case-particles')!.lessons!;
  expect(topics.map((topic) => topic.id)).toEqual(
    ['ga', 'wo', 'ni', 'he', 'de', 'to', 'kara', 'yori', 'no'].map((id) => 'particle-' + id),
  );
  for (const topic of topics) {
    for (const key of [topic.title, topic.intro, topic.note]) {
      expect(messages[key as keyof typeof messages].en).toBeTruthy();
      expect(messages[key as keyof typeof messages].ja).toBeTruthy();
    }
    expect(topic.rules.length).toBeGreaterThanOrEqual(2);
    for (const rule of topic.rules) {
      expect(rule.sentence!.japanese).toMatch(/。$/);
      for (const key of [rule.name, rule.rule, rule.sentence!.translation]) {
        expect(messages[key as keyof typeof messages].en).toBeTruthy();
        expect(messages[key as keyof typeof messages].ja).toBeTruthy();
      }
    }
  }
});

it('provides localized foundation, word-class and honorific lessons', () => {
  const read = (key: string) => {
    if (!key) return;
    const entry = messages[key as keyof typeof messages];
    expect(entry, key).toBeDefined();
    expect(entry.en, key).toBeTruthy();
    expect(entry.ja, key).toBeTruthy();
  };
  expect(grammarTopics.find((topic) => topic.id === 'word-classes')!.rules).toHaveLength(10);
  expect(grammarTopics.filter((topic) => topic.stage === '敬语系统')).toHaveLength(5);
  for (const topic of grammarTopics.filter(
    (topic) =>
      [
        'word-classes',
        'keigo-intro',
        'nouns',
        'adverbs',
        'adnominals',
        'conjunctions',
        'interjections',
        'auxiliaries',
        'particles-overview',
      ].includes(topic.id) || topic.stage === '敬语系统',
  )) {
    [topic.title, topic.intro, topic.note].forEach(read);
    for (const rule of topic.rules) {
      [rule.name, rule.rule].forEach(read);
      if (rule.sentence) {
        read(rule.sentence.translation);
        expect(rule.sentence.japanese).toMatch(/。$/);
      }
    }
  }
});
