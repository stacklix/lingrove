<script setup lang="ts">
import { computed } from 'vue';
import { useAppI18n } from '@lingrove/host-sdk/vue';
import type { Language } from '../curriculum';
import { introductions } from '../language-introductions';

const props = defineProps<{ language: Language }>();
const { t } = useAppI18n();
const introduction = computed(() => introductions[props.language]);
</script>

<template>
  <article class="language-introduction" :aria-label="t('语言概况')">
    <header class="introduction-header">
      <span class="eyebrow">{{ t('语言概况') }}</span>
      <h1 :lang="language">{{ introduction.nativeName }}</h1>
      <p>{{ t(introduction.summary) }}</p>
    </header>
    <dl class="introduction-facts">
      <div v-for="(value, key) in introduction.facts" :key="key">
        <dt>{{ t({ family: '语系', region: '主要使用地区', script: '文字系统' }[key]) }}</dt>
        <dd>{{ t(value) }}</dd>
      </div>
    </dl>
    <section class="introduction-section">
      <h2>{{ t('文字与读音') }}</h2>
      <p>{{ t(introduction.writingNote) }}</p>
    </section>
    <section class="introduction-section">
      <h2>{{ t('发展历史') }}</h2>
      <ol class="introduction-timeline">
        <li v-for="event in introduction.history" :key="event.period">
          <span class="introduction-period">{{ t(event.period) }}</span>
          <h3>{{ t(event.title) }}</h3>
          <p>{{ t(event.description) }}</p>
        </li>
      </ol>
    </section>
    <aside class="introduction-tip">
      <h2>{{ t('学习提示') }}</h2>
      <p>{{ t(introduction.tip) }}</p>
    </aside>
    <section class="introduction-section introduction-sources">
      <h2>{{ t('资料来源') }}</h2>
      <ul>
        <li v-for="source in introduction.sources" :key="source.url">
          <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.label }}</a>
        </li>
      </ul>
    </section>
  </article>
</template>
