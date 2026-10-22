<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { copyText, installFocusMode, ready, setRootPage } from '@lingrove/host-sdk';
import { useAppI18n } from '@lingrove/host-sdk/vue';
import { layouts, letterCase, replaceSelection, deleteSelection } from './keyboard';
import { appendHangul, isHangulKey } from './hangul';
const { t } = useAppI18n();
const language = ref('en');
const layout = computed(() => layouts.find(item => item.id === language.value)!);
const text = ref('');
const editor = ref<HTMLTextAreaElement>();
const shift = ref(false);
const caps = ref(false);
const symbols = ref(false);
const symbolPage = ref(false);
const status = ref('');
let start = 0, end = 0;
let composition: { start: number; history: string[] } | undefined;
function commit() { composition = undefined; }
let cleanup: (() => void) | undefined;
onMounted(async () => {
  cleanup = installFocusMode();
  try {
    await ready();
    await setRootPage(true);
  } catch {
    status.value = '打开失败，请返回后重试。';
  }
});
onUnmounted(() => cleanup?.());
const symbolRows = [
  ['1234567890', '-/:;()€&@"', '.,?!\'[]{}'],
  ['[]{}#%^*+=', '_\\|~<>$£¥₩', '.,?!\'`…•'],
];
const rows = computed(() => symbols.value ? symbolRows[Number(symbolPage.value)] : layout.value.rows);
function toggleShift() {
  if (symbols.value) symbolPage.value = !symbolPage.value;
  else { shift.value = !shift.value; caps.value = false; }
}
function toggleSymbols() {
  commit(); symbols.value = !symbols.value; symbolPage.value = false; shift.value = false;
}
function capture() { if (editor.value) { if (start !== editor.value.selectionStart || end !== editor.value.selectionEnd) commit(); start = editor.value.selectionStart; end = editor.value.selectionEnd; } }
async function edit(value: string, deleting = false) {
  let result;
  if (deleting && composition && start === end) {
    composition.history.pop();
    const pending = composition.history.at(-1) ?? '';
    result = replaceSelection(text.value, composition.start, end, pending);
    if (!pending) commit();
  } else if (!deleting && language.value === 'ko' && !symbols.value && isHangulKey(value)) {
    if (!composition) composition = { start, history: [] };
    const pending = appendHangul(composition.history.at(-1) ?? '', value);
    result = replaceSelection(text.value, composition.start, end, pending);
    composition.history.push(pending);
  } else {
    commit();
    result = deleting ? deleteSelection(text.value, start, end) : replaceSelection(text.value, start, end, value);
  }
  text.value = result.text; start = end = result.caret; status.value = '';
  if (!caps.value) shift.value = false;
  await nextTick();
  editor.value?.focus({ preventScroll: true }); editor.value?.setSelectionRange(start, end);
}
function key(value: string) { return letterCase(value, shift.value || caps.value, language.value); }
function changeLanguage() { commit(); shift.value = caps.value = false; }
async function copy() { commit(); try { await copyText(text.value); status.value = '已复制'; } catch { status.value = '复制失败，请重试'; } }
function clear() { commit(); text.value = ''; start = end = 0; status.value = ''; }
</script>

<template>
  <main>
    <div class="lingrove-root-actions"><button :disabled="!text" class="quiet" @click="clear">{{ t('清空') }}</button></div>
    <section class="workspace">
      <div class="section-heading"><label for="language">{{ t('键盘语言') }}</label><span> {{ symbols ? (symbolPage ? '#+=' : '123') : language.toUpperCase() }}</span></div>
      <select id="language" v-model="language" @change="changeLanguage"><option v-for="item in layouts" :key="item.id" :value="item.id">{{ t(item.name) }}</option></select>
      <div class="editor-card">
        <textarea ref="editor" v-model="text" inputmode="none" :lang="language" dir="auto" :aria-label="t('输入内容')" :placeholder="t('点击键位开始输入')" spellcheck="false" @select="capture" @click="capture" @keyup="capture" @input="commit(); capture(); status = ''" />
        <div class="editor-footer"><span aria-live="polite" role="status">{{ t(status) }}</span><button class="copy" :disabled="!text" @click="copy">{{ t('复制文字') }}</button></div>
      </div>
      <p class="hint">{{ t(language === 'ko' ? '韩语使用两式键盘，辅音和元音自动合成音节；删除可逐步撤销输入。' : '切换语言不会清空文字。重音字符可直接点选。') }}</p>
    </section>
    <section class="keyboard" :aria-label="t('字母键盘')" @pointerdown.prevent>
      <div v-if="!symbols && layout.extra" class="extras" :aria-label="t('重音与扩展字母')"><button v-for="char in layout.extra" :key="char" @click="edit(key(char))">{{ key(char) }}</button></div>
      <div v-for="(row, index) in rows" :key="index" class="key-row"><button v-for="char in row" :key="char" class="letter" @click="edit(symbols ? char : key(char))">{{ symbols ? char : key(char) }}</button></div>
      <div class="key-row"><button class="function" :class="{ active: symbols ? symbolPage : shift || caps }" :aria-label="t(symbols ? '切换符号页' : language === 'ko' ? '切换双辅音与扩展元音' : '切换大小写')" :aria-pressed="symbols ? symbolPage : shift || caps" @click="toggleShift">{{ symbols ? (symbolPage ? '123' : '#+=') : '⇧' }}</button><button v-if="!symbols && language !== 'ko'" class="function" :class="{ active: caps }" :aria-label="t('大写锁定')" :aria-pressed="caps" @click="caps = !caps; shift = false">⇪</button><button class="function" :aria-pressed="symbols" :aria-label="t(symbols ? '字母' : '符号')" @click="toggleSymbols">{{ symbols ? t('字母') : '123' }}</button><button class="space" @click="edit(' ')">{{ t('空格') }}</button><button class="function" :aria-label="t('删除字符')" @click="edit('', true)">⌫</button><button class="function" :aria-label="t('换行')" @click="edit('\n')">↵</button></div>
    </section>
  </main>
</template>
