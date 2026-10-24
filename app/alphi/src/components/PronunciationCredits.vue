<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t } = useAppI18n();
import { computed } from 'vue';
import type { Language } from '../curriculum';
import samples from '../pronunciation-samples.json';
import sources from '../pronunciation-sources.json';

const props = defineProps<{ language: Language }>();
const entries = computed(() =>
  sources
    .filter((source) => source.id.startsWith(`${props.language}-`))
    .map((source) => ({
      ...source,
      text: samples.find((sample) => sample.id === source.id)?.text,
    })),
);
</script>

<template>
  <details class="pronunciation-credits">
    <summary>{{ t('发音来源与许可') }}</summary>
    <p v-if="['hy', 'ka', 'ko'].includes(language)">
      {{
        t(
          '新增字母真人录音：亚美尼亚语由母语者 Vahagn Petrosyan 录制（CC BY-SA 3.0），已截取单字母并降噪，修改后的音频沿用该许可。格鲁吉亚语来自 Learn Kartuli 母语者录音；韩语来自 zKorean 字母教学录音，辅音包含名称与读音。后两者仅供个人学习，未确认公开再分发许可。',
        )
      }}
    </p>
    <p v-else-if="language === 'vi'">
      {{
        t(
          '越南语录音来自北伊利诺伊大学 SEAsite 字母教材，大小写共用字母读音。音频仅供个人学习，保留原始来源；未确认公开再分发许可。',
        )
      }}
    </p>
    <p v-else-if="language === 'ja'">
      {{ t('日语录音来自') }}
      <a
        href="https://www.tofugu.com/japanese/learn-hiragana/"
        target="_blank"
        rel="noopener noreferrer"
        >Tofugu · Learn Hiragana</a
      >
      {{ t('的假名教学音频。本地个人学习使用，保留原站来源信息。') }}
    </p>
    <p v-else-if="language === 'ru'">
      {{ t('俄语录音：Cherus / Wikimedia Commons，') }}
      <a
        href="https://creativecommons.org/licenses/by-sa/3.0/"
        target="_blank"
        rel="noopener noreferrer"
        >CC BY-SA 3.0</a
      >{{ t('。 转换格式并裁去首尾空白；修改后的音频继续按 CC BY-SA 3.0 提供。') }}
    </p>
    <p v-else-if="language === 'el'">
      {{
        t(
          '现代希腊语录音：CuteHappyBrute / Wikimedia Commons，RoB 降噪及均衡处理，公有领域（PD-self）。 从完整字母表朗读中截取各字母；σ 与词尾 ς 共用字母名称。',
        )
      }}
    </p>
    <p v-if="entries.length">
      {{ t('音频已转换为离线格式，部分截取单次发音；未调整语速或音高。各录音的原始页面：') }}
    </p>
    <div class="pronunciation-source-links">
      <a
        v-for="entry in entries"
        :key="entry.id"
        :href="entry.sourcePage"
        target="_blank"
        rel="noopener noreferrer"
        >{{ entry.text }}</a
      >
    </div>
  </details>
</template>
