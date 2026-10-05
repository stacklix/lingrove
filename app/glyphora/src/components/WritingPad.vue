<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { isNative, invoke, createID, streams } from '@lingrove/host-sdk';
import { eraseAt, copyStrokes } from '../ink';
import type { Glyph } from '../curriculum';
import type { Strokes, Point } from '../scoring';
import { raster, template } from '../render';
const props = defineProps<{
  glyph: Glyph;
  tracing: boolean;
  disabled?: boolean;
  obscured?: boolean;
  compactTools?: boolean;
  inlineActions?: boolean;
  initialStrokes?: Strokes;
  initialDrawing?: string;
}>();
const emit = defineEmits<{
  submit: [strokes: Strokes];
  change: [];
  ink: [strokes: Strokes, drawing?: string];
}>();
const strokes = ref<Strokes>(copyStrokes(props.initialStrokes ?? [])),
  canvas = ref<HTMLCanvasElement>(),
  finger = ref(false),
  eraser = ref(false),
  undoStack = ref<Strokes[]>([]),
  error = ref('');
const native = ref(false),
  nativeUndo = ref(false);
const sessionID = createID();
let alive = true;
let nativeDrawing = props.initialDrawing;
let resize: ResizeObserver | undefined;
let frame = 0;
function nativeCall(action: string, params: Record<string, unknown> = {}) {
  return invoke(
    'handwriting.inline',
    JSON.parse(JSON.stringify({ id: sessionID, action, ...params })),
  );
}
function placement() {
  const rect = canvas.value!.getBoundingClientRect();
  const bottom = document.querySelector('.bottom-tabs')?.getBoundingClientRect().height ?? 0;
  return { rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, bottom };
}
function layout() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    if (alive && native.value && canvas.value)
      void nativeCall('layout', placement()).catch(() => {});
  });
}
watch(
  () => [finger.value, eraser.value, props.disabled, props.obscured],
  () => {
    if (native.value)
      void nativeCall('configure', {
        finger: finger.value,
        eraser: eraser.value,
        locked: !!props.disabled,
        hidden: !!props.obscured,
      }).catch((e) => {
        error.value = String(e);
      });
  },
);
onBeforeUnmount(() => {
  alive = false;
  resize?.disconnect();
  cancelAnimationFrame(frame);
  window.removeEventListener('scroll', layout);
  window.removeEventListener('resize', layout);
  streams.delete(sessionID);
  if (isNative()) void nativeCall('detach').catch(() => {});
});
let pointer: number | null = null;
let beforeGesture: Strokes | null = null;
function paint() {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, 256, 256);
  if (props.tracing) {
    ctx.globalAlpha = 0.18;
    ctx.drawImage(template(props.glyph), 0, 0);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(raster(strokes.value), 0, 0);
}
function clear() {
  if (native.value) {
    void nativeCall('clear').catch((e) => {
      error.value = String(e);
    });
    return;
  }
  strokes.value = [];
  pointer = null;
  beforeGesture = null;
  undoStack.value = [];
  error.value = '';
  emit('ink', []);
  paint();
  emit('change');
}
function undo() {
  if (native.value) {
    void nativeCall('undo').catch((e) => {
      error.value = String(e);
    });
    return;
  }
  const previous = undoStack.value.pop();
  if (!previous) return;
  strokes.value = previous;
  emit('ink', copyStrokes(strokes.value));
  paint();
  emit('change');
}
function point(event: PointerEvent): Point {
  const r = canvas.value!.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)),
    y: Math.min(1, Math.max(0, (event.clientY - r.top) / r.height)),
  };
}
function erase(point: Point) {
  const remaining = eraseAt(strokes.value, point);
  if (remaining.length === strokes.value.length) return;
  if (beforeGesture) {
    remember(beforeGesture);
    beforeGesture = null;
  }
  strokes.value = remaining;
  paint();
  emit('change');
}
function remember(previous: Strokes) {
  undoStack.value.push(previous);
  if (undoStack.value.length > 30) undoStack.value.shift();
}
function down(event: PointerEvent) {
  if (
    native.value ||
    props.disabled ||
    pointer !== null ||
    (event.pointerType === 'touch' && !finger.value)
  )
    return;
  if (!eraser.value && strokes.value.length >= 128) {
    error.value = '笔画较多，请清空后重新书写。';
    return;
  }
  pointer = event.pointerId;
  canvas.value!.setPointerCapture(pointer);
  beforeGesture = copyStrokes(strokes.value);
  if (eraser.value) {
    erase(point(event));
    return;
  }
  remember(beforeGesture);
  beforeGesture = null;
  strokes.value.push([point(event)]);
  paint();
  emit('change');
}
function move(event: PointerEvent) {
  if (pointer !== event.pointerId || props.disabled) return;
  const samples = event.getCoalescedEvents?.();
  for (const e of samples?.length ? samples : [event]) {
    if (eraser.value) erase(point(e));
    else {
      const stroke = strokes.value.at(-1)!;
      if (stroke.length < 2048) stroke.push(point(e));
    }
  }
  paint();
}
function up(event: PointerEvent) {
  if (event.pointerId !== pointer) return;
  move(event);
  emit('ink', copyStrokes(strokes.value));
  pointer = null;
  beforeGesture = null;
}
function cancel(event: PointerEvent) {
  if (event.pointerId === pointer) {
    emit('ink', copyStrokes(strokes.value));
    pointer = null;
    beforeGesture = null;
  }
}
watch(() => [props.glyph.id, props.tracing], clear);
onMounted(async () => {
  paint();
  if (!isNative()) return;
  streams.set(sessionID, (chunk) => {
    if (!alive) return;
    const value = JSON.parse(chunk);
    strokes.value = value.strokes;
    nativeDrawing = value.drawing;
    nativeUndo.value = value.canUndo;
    emit('ink', copyStrokes(strokes.value), nativeDrawing);
    emit('change');
  });
  try {
    await nextTick();
    await nativeCall('attach', {
      ...placement(),
      reference: props.tracing ? template(props.glyph).toDataURL() : undefined,
      drawing: nativeDrawing,
      strokes: strokes.value,
      locked: !!props.disabled,
      hidden: !!props.obscured,
    });
    if (!alive) {
      await nativeCall('detach');
      return;
    }
    native.value = true;
    // The sheet may have opened while the native attachment was in flight.
    await nativeCall('configure', {
      finger: finger.value,
      eraser: eraser.value,
      locked: !!props.disabled,
      hidden: !!props.obscured,
    });
    resize = new ResizeObserver(layout);
    resize.observe(canvas.value!);
    window.addEventListener('scroll', layout, { passive: true });
    window.addEventListener('resize', layout);
  } catch (e) {
    console.warn('Inline PencilKit unavailable', e);
    streams.delete(sessionID);
    await nativeCall('detach').catch(() => {});
    // Older hosts retain the fully functional inline web canvas.
    native.value = false;
  }
});
defineExpose({ clear });
</script>
<template>
  <div class="writing-pad">
    <div class="paper">
      <canvas
        ref="canvas"
        width="256"
        height="256"
        aria-label="手写练习区域"
        @pointerdown.prevent="down"
        @pointermove.prevent="move"
        @pointerup.prevent="up"
        @pointercancel="cancel"
        @lostpointercapture="cancel"
        :class="{ locked: disabled || native, erasing: eraser, 'native-placeholder': native }"
      />
    </div>
    <div class="pad-tools">
      <button
        v-if="!compactTools"
        @click="undo"
        :disabled="disabled || (native ? !nativeUndo : !undoStack.length)"
      >
        撤销
      </button>
      <button v-if="!inlineActions" @click="clear" :disabled="disabled || !strokes.length">
        清空
      </button>
      <button
        v-if="!compactTools"
        :aria-pressed="eraser"
        :class="{ selected: eraser }"
        @click="eraser = !eraser"
        :disabled="disabled"
      >
        {{ eraser ? '切换为笔' : '橡皮' }}
      </button>
      <label><input type="checkbox" v-model="finger" :disabled="disabled" />允许手指</label>
    </div>
    <div v-if="inlineActions" class="pad-actions">
      <button @click="clear" :disabled="disabled || !strokes.length">清空</button>
      <button
        class="primary"
        :disabled="disabled || !strokes.length"
        @click="emit('submit', copyStrokes(strokes))"
      >
        评分 <span>→</span>
      </button>
    </div>
    <p class="pad-hint">直接用 Apple Pencil 在格内书写；可在画板外滑动页面。</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <button
      v-if="!inlineActions"
      class="primary wide"
      :disabled="disabled || !strokes.length"
      @click="emit('submit', copyStrokes(strokes))"
    >
      评分 <span>→</span>
    </button>
  </div>
</template>
