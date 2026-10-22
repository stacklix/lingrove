<script setup lang="ts">
import { ref } from 'vue';
import { useAppI18n } from '@lingrove/host-sdk/vue';
import { flickIndex, kanaGroups } from './kana';
import { toKatakana } from './japanese';
defineProps<{ katakana: boolean }>();
const emit = defineEmits<{ input: [value: string]; modify: [] }>();
const { t } = useAppI18n();
const gesture = ref<{ id: number; group: string; x: number; y: number; index: number }>();
function down(event: PointerEvent, group: string) {
  if (gesture.value || !event.isPrimary || event.button !== 0) return;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  gesture.value = { id: event.pointerId, group, x: event.clientX, y: event.clientY, index: 0 };
}
function move(event: PointerEvent) {
  const current = gesture.value;
  if (current?.id === event.pointerId) current.index = flickIndex(event.clientX - current.x, event.clientY - current.y);
}
function choose(group: string, index: number, katakana: boolean) {
  const char = group[index];
  if (char && char !== ' ') emit('input', katakana ? toKatakana(char) : char);
}
function up(event: PointerEvent, katakana: boolean) {
  const current = gesture.value;
  if (current?.id !== event.pointerId) return;
  move(event);
  choose(current.group, current.index, katakana);
  gesture.value = undefined;
}
function arrow(event: KeyboardEvent, group: string, katakana: boolean) {
  const index = { ArrowLeft: 1, ArrowUp: 2, ArrowRight: 3, ArrowDown: 4 }[event.key];
  if (index !== undefined) { event.preventDefault(); choose(group, index, katakana); }
}
</script>

<template>
  <div class="kana-grid" :aria-label="t('假名滑动键盘')" role="group">
    <button v-for="group in kanaGroups" :key="group" class="kana-key" :aria-label="(katakana ? toKatakana(group) : group).replaceAll(' ', '')"
      @pointerdown="down($event, group)" @pointermove="move" @pointerup="up($event, katakana)"
      @pointercancel="gesture = undefined" @lostpointercapture="gesture = undefined"
      @keydown="arrow($event, group, katakana)" @click="$event.detail === 0 && choose(group, 0, katakana)">
      <span v-for="(char, index) in group" :key="index" :class="['kana-position', `kana-position-${index}`, { 'kana-selected': gesture?.group === group && gesture.index === index }]" aria-hidden="true">{{ katakana ? toKatakana(char) : char }}</span>
    </button>
    <button class="function kana-modifier" :aria-label="t('切换浊音、半浊音与小假名')" @click="emit('modify')">小゛゜</button>
  </div>
</template>
