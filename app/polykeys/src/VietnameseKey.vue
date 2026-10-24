<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useAppI18n } from '@lingrove/host-sdk/vue';
import { vietnameseVariants } from './vietnamese';

const props = defineProps<{ value: string }>();
const emit = defineEmits<{ input: [value: string]; literal: [value: string] }>();
const { t } = useAppI18n();
const variants = computed(() => vietnameseVariants(props.value));
const anchor = ref<HTMLButtonElement>();
const panel = ref<HTMLDivElement>();
const open = ref(false);
const selected = ref<string>();
const position = ref({ left: '8px', top: '8px', gridTemplateColumns: '' });
let timer: ReturnType<typeof setTimeout> | undefined;
let gesture: { id: number; x: number; y: number } | undefined;

function cancel() {
  clearTimeout(timer); timer = undefined; gesture = undefined; open.value = false; selected.value = undefined;
}
function outside(event: PointerEvent) {
  if (!panel.value?.contains(event.target as Node) && !anchor.value?.contains(event.target as Node)) cancel();
}
watch(open, value => value ? document.addEventListener('pointerdown', outside, true) : document.removeEventListener('pointerdown', outside, true));
watch(() => props.value, cancel);
onUnmounted(() => { cancel(); document.removeEventListener('pointerdown', outside, true); });

function show() {
  if (!variants.value.length || !anchor.value) return;
  const rect = anchor.value.getBoundingClientRect();
  const columns = Math.min(6, variants.value.length);
  const width = columns * 40 + (columns - 1) * 4 + 14;
  const height = Math.ceil(variants.value.length / columns) * 44 + (Math.ceil(variants.value.length / columns) - 1) * 4 + 14;
  position.value = {
    left: `${Math.max(8, Math.min(rect.left - width / 2 + rect.width / 2, window.innerWidth - width - 8))}px`,
    top: `${Math.max(8, rect.top - height - 10)}px`,
    gridTemplateColumns: `repeat(${columns},40px)`,
  };
  selected.value = props.value;
  open.value = true;
}
function down(event: PointerEvent) {
  if (gesture || !event.isPrimary || event.button !== 0) return;
  anchor.value?.setPointerCapture(event.pointerId);
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  if (variants.value.length) timer = setTimeout(show, 400);
}
function contains(rect: DOMRect, event: PointerEvent) {
  return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}
function move(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return;
  if (!open.value) {
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 12) cancel();
    return;
  }
  const option = [...(panel.value?.querySelectorAll('button') ?? [])].find(button => contains(button.getBoundingClientRect(), event));
  if (option) selected.value = option.textContent ?? undefined;
  else if (anchor.value && contains(anchor.value.getBoundingClientRect(), event)) selected.value = props.value;
  else if (!panel.value || !contains(panel.value.getBoundingClientRect(), event)) selected.value = undefined;
}
function up(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return;
  move(event);
  if (!gesture) return;
  if (open.value) { if (selected.value) emit('literal', selected.value); }
  else emit('input', props.value);
  cancel();
}
function choose(value: string) { cancel(); emit('literal', value); }
async function keydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' && variants.value.length) {
    event.preventDefault(); show(); await nextTick(); panel.value?.querySelector('button')?.focus();
  }
}
function navigate(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); cancel(); anchor.value?.focus(); return; }
  if (event.key === 'Tab') { cancel(); anchor.value?.focus(); return; }
  const buttons = [...(panel.value?.querySelectorAll('button') ?? [])];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -Math.min(6, buttons.length), ArrowDown: Math.min(6, buttons.length) }[event.key];
  if (step !== undefined) {
    event.preventDefault(); const next = buttons[(index + step + buttons.length) % buttons.length];
    selected.value = next.textContent ?? undefined; next.focus();
  }
}
</script>

<template>
  <button ref="anchor" class="letter vietnamese-key" :aria-haspopup="variants.length ? 'true' : undefined" :aria-expanded="variants.length ? open : undefined"
    @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="cancel" @lostpointercapture="cancel"
    @keydown="keydown" @contextmenu.prevent @click="$event.detail === 0 && emit('input', value)">{{ value }}</button>
  <Teleport to="body">
    <div v-if="open" ref="panel" class="vietnamese-variants" role="group" :aria-label="t('选择字母变体')" :style="position" @keydown="navigate" @pointerdown.prevent>
      <button v-for="char in variants" :key="char" :class="{ selected: selected === char }" @click="choose(char)">{{ char }}</button>
    </div>
  </Teleport>
</template>
