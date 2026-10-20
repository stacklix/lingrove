<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
import type { GrammarSentence } from '../grammar';
defineProps<{ sentence?: GrammarSentence }>();
const { t } = useAppI18n();
</script>

<template>
  <div v-if="sentence" class="grammar-sentence">
    <p class="grammar-sentence-label">{{ t('例句') }}</p>
    <p lang="ja">{{ sentence.japanese }}</p>
    <p class="grammar-sentence-translation">{{ t(sentence.translation) }}</p>
  </div>
</template>
