<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fontFor, type Glyph } from '../curriculum';
const props = defineProps<{ glyph: Glyph; animate?: boolean }>();
const generation = ref(0);
watch(
  () => props.glyph.id,
  () => generation.value++,
);
const label = computed(() => `手写范字 ${props.glyph.text}`);
</script>
<template>
  <svg
    v-if="glyph.paths"
    :key="`${glyph.id}-${generation}-${animate}`"
    viewBox="0 0 109 109"
    class="glyph-svg"
    role="img"
    :aria-label="label"
  >
    <path
      v-for="(path, i) in glyph.paths"
      :key="i"
      :d="path"
      fill="none"
      stroke="currentColor"
      stroke-width="2.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      pathLength="1"
      :class="{ animated: animate }"
      :style="{ '--delay': `${i * 0.8}s` }"
    />
  </svg>
  <span v-else class="handwritten" :style="{ fontFamily: fontFor(glyph) }" :aria-label="label">{{
    glyph.text
  }}</span>
</template>
