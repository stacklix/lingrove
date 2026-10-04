<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '../curriculum';
import samples from '../pronunciation-samples.json';
import sources from '../pronunciation-sources.json';

const props = defineProps<{ language: Language }>();
const entries = computed(() => sources
  .filter((source) => source.id.startsWith(`${props.language}-`))
  .map((source) => ({ ...source, text: samples.find((sample) => sample.id === source.id)?.text })));
</script>

<template>
  <details class="pronunciation-credits">
    <summary>发音来源与许可</summary>
    <p v-if="language === 'ja'">
      日语录音来自
      <a href="https://www.tofugu.com/japanese/learn-hiragana/" target="_blank" rel="noopener noreferrer">Tofugu · Learn Hiragana</a>
      的假名教学音频。本地个人学习使用，保留原站来源信息。
    </p>
    <p v-else-if="language === 'ru'">
      俄语录音：Cherus / Wikimedia Commons，
      <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>。
      转换格式并裁去首尾空白；修改后的音频继续按 CC BY-SA 3.0 提供。
    </p>
    <p v-else>
      现代希腊语录音：CuteHappyBrute / Wikimedia Commons，RoB 降噪及均衡处理，公有领域（PD-self）。
      从完整字母表朗读中截取各字母；σ 与词尾 ς 共用字母名称。
    </p>
    <p>音频已转换为离线格式，部分截取单次发音；未调整语速或音高。各录音的原始页面：</p>
    <div class="pronunciation-source-links">
      <a v-for="entry in entries" :key="entry.id" :href="entry.sourcePage" target="_blank" rel="noopener noreferrer">{{ entry.text }}</a>
    </div>
  </details>
</template>
