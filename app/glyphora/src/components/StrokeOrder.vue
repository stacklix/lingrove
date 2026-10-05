<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { Glyph } from '../curriculum';
import { strokeSteps } from '../stroke-order';
import { russianPaths } from '../russian-paths';
import { greekPaths } from '../greek-paths';
import GlyphView from './GlyphView.vue';
const props = defineProps<{ glyph: Glyph; autoplay?: boolean }>();
const paths = computed(
  () =>
    props.glyph.paths ??
    (props.glyph.language === 'ru' ? russianPaths[props.glyph.text] : greekPaths[props.glyph.text]),
);
const hasAnimation = ref(false);
const step = ref(0),
  playing = ref(false),
  cycle = ref(0);
const steps = computed(() => strokeSteps(props.glyph));
let timer: ReturnType<typeof setInterval> | undefined;
function stop() {
  playing.value = false;
  clearInterval(timer);
}
function play() {
  if (playing.value) {
    stop();
    return;
  }
  if (step.value >= steps.value.length - 1) step.value = 0;
  hasAnimation.value = true;
  playing.value = true;
  cycle.value++;
  timer = setInterval(() => {
    if (step.value >= steps.value.length - 1) stop();
    else step.value++;
  }, 1800);
}
function select(index: number) {
  stop();
  hasAnimation.value = false;
  step.value = index;
  cycle.value++;
}
watch(
  () => props.glyph.id,
  () => select(0),
);
onMounted(() => {
  if (props.autoplay && paths.value) play();
});
onBeforeUnmount(stop);
const start = computed(() => {
  const match = paths.value?.[step.value]?.match(/^M\s*([\d.-]+)[,\s]+([\d.-]+)/i);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
});
</script>
<template>
  <div class="stroke-order">
    <div class="order-example">
      <div v-if="glyph.language !== 'ja'" class="order-print">
        <small>印刷体</small><b>{{ glyph.text }}</b>
      </div>
      <svg
        v-if="paths"
        viewBox="0 0 109 109"
        class="order-canvas"
        role="img"
        :aria-label="`${glyph.text} 第 ${step + 1} 笔`"
      >
        <path
          v-for="(path, i) in paths"
          :key="i"
          :d="path"
          fill="none"
          stroke="currentColor"
          stroke-width="2.8"
          stroke-linecap="round"
          :opacity="i < step ? 1 : 0.14"
        />
        <path
          :key="`${step}-${cycle}`"
          :d="paths[step]"
          fill="none"
          stroke="#ae6745"
          stroke-width="3"
          stroke-linecap="round"
          pathLength="1"
          :class="{ 'order-active': hasAnimation }"
          :style="{ animationPlayState: playing ? 'running' : 'paused' }"
        />
        <circle v-if="start" :cx="start.x" :cy="start.y" r="2.5" fill="#ae6745" />
      </svg>
      <GlyphView v-else :glyph="glyph" />
    </div>
    <p v-if="glyph.language !== 'ja' && paths" class="fine-print">
      动画为一种手写笔顺示意，连笔与字帖字体可有差异。
    </p>
    <p v-if="!paths" class="fine-print">
      一种参考书写顺序；实际连笔与起收笔可有合理变体。下方逐步说明笔的走向。
    </p>
    <div v-if="paths" class="order-controls">
      <button @click="play">{{ playing ? '暂停' : '播放' }}</button
      ><button :disabled="step === 0" @click="select(step - 1)">上一笔</button
      ><button :disabled="step === steps.length - 1" @click="select(step + 1)">下一笔</button>
    </div>
    <ol class="stroke-steps">
      <li v-for="(text, i) in steps" :key="i" :class="{ current: paths && step === i }">
        <button v-if="paths" @click="select(i)">{{ text }}</button><span v-else>{{ text }}</span>
      </li>
    </ol>
    <p>{{ glyph.hint }}</p>
  </div>
</template>
