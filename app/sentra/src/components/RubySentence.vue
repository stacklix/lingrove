<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ text: string; parts: { text: string; reading: string }[] }>();
const segments = computed(() =>
  Array.isArray(props.parts) &&
  props.parts.every((part) => part && typeof part.text === 'string') &&
  props.parts.map((part) => part.text).join('') === props.text
    ? props.parts
    : [{ text: props.text, reading: '' }],
);
</script>
<template>
  <p class="translation ruby-sentence" lang="ja">
    <template v-for="(part, index) in segments" :key="index"
      ><ruby v-if="part.reading"
        >{{ part.text }}<rt>{{ part.reading }}</rt></ruby
      ><template v-else>{{ part.text }}</template></template
    >
  </p>
</template>
<style scoped>
.ruby-sentence {
  line-height: 2.4;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
ruby {
  ruby-position: over;
}
rt {
  font-size: 0.5em;
  color: var(--muted);
}
</style>
