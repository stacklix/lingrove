import { expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { grammarTopics } from '../src/grammar';
import GrammarExample from '../src/components/GrammarExample.vue';
import messages from '../../../packages/host-sdk/src/locales/messages.json';

it('provides complete sentences and translated meanings for every inflection and usage', () => {
  const entries = grammarTopics.flatMap((topic) => [
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
  for (const section of grammarTopics.find((topic) => topic.id === 'adjectives')!.sections!) {
    expect(section.forms.find((form) => form.name === '命令形')!.sentence).toBeUndefined();
  }
});

it('renders Japanese and its meaning as separate paragraphs', () => {
  const sentence = grammarTopics.find((topic) => topic.id === 'mizen')!.rules[0].sentence!;
  const wrapper = mount(GrammarExample, { props: { sentence } });
  expect(wrapper.get('[lang="ja"]').text()).toBe(sentence.japanese);
  expect(wrapper.get('.grammar-sentence-translation').text()).toBe(sentence.translation);
  wrapper.unmount();
});
