<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
const props = defineProps<{ open: boolean; title: string; saveForm?: string; saving?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
const rendered = ref(false);
let previousOverflow = '';
let locked = false;
let closing: Animation | undefined;
function unlock() {
  if (locked) document.body.style.overflow = previousOverflow;
  locked = false;
}
watch(
  () => props.open,
  async (open) => {
    closing?.cancel();
    const element = dialog.value;
    if (!element) return;
    if (open) {
      rendered.value = true;
      if (!locked) previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      locked = true;
      if (!element.open) element.showModal();
    } else {
      if (
        element.open &&
        element.animate &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        closing = element.animate(
          [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(35px)', opacity: 0 },
          ],
          { duration: 160, easing: 'ease-in', fill: 'forwards' },
        );
        try {
          await closing.finished;
        } catch {
          return;
        }
      }
      if (!props.open) {
        element.close();
        rendered.value = false;
        unlock();
      }
    }
  },
  { flush: 'post' },
);
onBeforeUnmount(() => {
  closing?.cancel();
  dialog.value?.close();
  unlock();
});
function dismiss() {
  if (!props.saving) emit('close');
}
function backdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return;
  const bounds = dialog.value!.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    dismiss();
}
</script>
<template>
  <dialog
    ref="dialog"
    class="sheet"
    :aria-label="title"
    @cancel.prevent="dismiss"
    @click="backdrop"
  >
    <div class="sheet-header" :class="{ 'sheet-header-actions': saveForm }">
      <span class="sheet-handle" aria-hidden="true"></span>
      <button
        v-if="saveForm"
        autofocus
        type="button"
        class="sheet-cancel"
        :disabled="saving"
        @click="dismiss"
      >
        取消
      </button>
      <h2>{{ title }}</h2>
      <button v-if="saveForm" type="submit" class="sheet-save" :form="saveForm" :disabled="saving">
        {{ saving ? '保存中…' : '保存' }}
      </button>
      <button
        v-else
        autofocus
        type="button"
        class="sheet-close"
        aria-label="关闭面板"
        @click="dismiss"
      >
        ×
      </button>
    </div>
    <div class="sheet-content"><slot v-if="rendered" /></div>
  </dialog>
</template>
