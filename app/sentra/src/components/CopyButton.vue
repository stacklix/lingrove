<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t } = useAppI18n();
import { onBeforeUnmount, ref } from 'vue';
import { copyText } from '@lingrove/host-sdk';
const props = withDefaults(defineProps<{ text: string; label?: string; disabled?: boolean }>(), {
  label: '复制',
});
const state = ref<'idle' | 'busy' | 'done' | 'error'>('idle');
let timer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(timer);
});
async function copy() {
  if (state.value === 'busy') return;
  clearTimeout(timer);
  state.value = 'busy';
  try {
    await copyText(props.text);
    if (!disposed) state.value = 'done';
  } catch {
    if (!disposed) state.value = 'error';
  }
  if (!disposed)
    timer = setTimeout(() => {
      state.value = 'idle';
    }, 1800);
}
</script>
<template>
  <button
    type="button"
    class="text-button copy-button"
    :class="{ 'copy-success': state === 'done' }"
    :disabled="disabled || state === 'busy'"
    @click="copy"
  >
    <span aria-live="polite">{{
      t(
        state === 'done'
          ? '✓ 已复制'
          : state === 'error'
            ? '复制失败，重试'
            : state === 'busy'
              ? '复制中…'
              : label,
      )
    }}</span>
  </button>
</template>
