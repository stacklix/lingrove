<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { copyText, installFocusMode, ready, setRootPage } from '@lingrove/host-sdk';
import { useAppI18n } from '@lingrove/host-sdk/vue';
import { layouts, letterCase, replaceSelection, deleteSelection } from './keyboard';
import KanaKeyboard from './KanaKeyboard.vue';
import { kanaVariant } from './kana';
import { composeJapanese } from './japanese';
import { appendHangul, isHangulKey } from './hangul';
const { t } = useAppI18n();
const layoutId = ref('en');
const layout = computed(() => layouts.find(item => item.id === layoutId.value)!);
const language = computed(() => layout.value.locale);
const text = ref('');
const editor = ref<HTMLTextAreaElement>();
const shift = ref(false);
const caps = ref(false);
const katakana = ref(false);
const japaneseMode = ref('romaji');
const symbols = ref(false);
const symbolPage = ref(false);
const status = ref('');
let start = 0, end = 0;
let composition: { start: number; history: string[]; japanese?: boolean } | undefined;
function commit() {
  if (composition?.japanese) {
    const result = replaceSelection(text.value, composition.start, end, composeJapanese(composition.history.at(-1) ?? '', katakana.value, true));
    text.value = result.text; start = end = result.caret;
  }
  composition = undefined;
}
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
  else if (language.value === 'ja') { commit(); katakana.value = !katakana.value; }
  else { shift.value = !shift.value; caps.value = false; }
}
function toggleSymbols() {
  commit(); symbols.value = !symbols.value; symbolPage.value = false; shift.value = false;
}
function capture() { if (editor.value) { if (start !== editor.value.selectionStart || end !== editor.value.selectionEnd) commit(); start = editor.value.selectionStart; end = editor.value.selectionEnd; } }
function externalInput() { composition = undefined; capture(); status.value = ''; }
async function edit(value: string, deleting = false) {
  let result;
  if (deleting && composition && start === end) {
    composition.history.pop();
    const raw = composition.history.at(-1) ?? '';
    const pending = composition.japanese ? composeJapanese(raw, katakana.value) : raw;
    result = replaceSelection(text.value, composition.start, end, pending);
    if (!pending) commit();
  } else if (!deleting && language.value === 'ja' && japaneseMode.value === 'romaji' && !symbols.value && /^[a-z']$/.test(value)) {
    if (!composition) composition = { start, history: [], japanese: true };
    const raw = (composition.history.at(-1) ?? '') + value;
    result = replaceSelection(text.value, composition.start, end, composeJapanese(raw, katakana.value));
    composition.history.push(raw);
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
async function modifyKana() {
  commit();
  const from = start === end ? Math.max(0, start - 1) : start;
  const selected = text.value.slice(from, end);
  if (selected.length !== 1) return;
  const variant = kanaVariant(selected);
  if (variant === selected) return;
  start = from;
  await edit(variant);
}
function key(value: string) { return letterCase(value, shift.value || caps.value, language.value); }
function changeLanguage() { commit(); shift.value = caps.value = false; }
async function copy() { commit(); try { await copyText(text.value); status.value = '已复制'; } catch { status.value = '复制失败，请重试'; } }
function clear() { commit(); text.value = ''; start = end = 0; status.value = ''; }
</script>

<template>
  <main :class="{ 'kana-mode': language === 'ja' && japaneseMode === 'kana' && !symbols }">
    <div class="lingrove-root-actions">
      <select id="language" v-model="layoutId" class="lingrove-language-select" :aria-label="t('键盘语言')" @change="changeLanguage"><option v-for="item in layouts" :key="item.id" :value="item.id">{{ t(item.name) }}</option></select>
    </div>
    <section class="workspace">
      <div class="editor-card">
        <textarea ref="editor" v-model="text" inputmode="none" :lang="language" dir="auto" :aria-label="t('输入内容')" :placeholder="t('点击键位开始输入')" spellcheck="false" @select="capture" @click="capture" @keyup="capture" @input="externalInput" />
        <div class="editor-footer">
          <span class="editor-status" aria-live="polite" role="status">{{ t(status) }}</span>
          <div class="editor-actions"><button :disabled="!text" class="quiet" @click="clear">{{ t('清空') }}</button><button class="copy" :disabled="!text" @click="copy">{{ t('复制') }}</button></div>
        </div>
      </div>
      <label v-if="language === 'ja'" class="input-method">{{ t('日语输入方式') }}<select v-model="japaneseMode" class="lingrove-language-select" @change="commit"><option value="romaji">{{ t('罗马字') }}</option><option value="kana">{{ t('九宫格假名') }}</option></select></label>
      <p v-if="language === 'ja' && japaneseMode === 'kana'" class="hint">{{ t('点按中央，向四周滑动选择假名；小゛゜切换浊音与小假名。支持键盘方向键，不提供汉字转换。') }}</p>
      <p v-else class="hint">{{ t(language === 'ja' ? '日语使用罗马字输入假名，可切换平假名和片假名；不提供汉字转换。' : language === 'ka' ? '格鲁吉亚语使用 Shift 输入扩展字母，输入后自动恢复；切换语言保留文字。' : language === 'ko' ? '韩语使用两式键盘，辅音和元音自动合成音节；删除可逐步撤销输入。' : '切换语言不会清空文字。扩展区可输入重音和补充字母。') }}</p>
    </section>
    <section class="keyboard" :aria-label="t('字母键盘')" @pointerdown.prevent>
      <div v-if="!symbols && layout.extra && !(language === 'ja' && japaneseMode === 'kana')" class="extras" role="group" :aria-label="t('重音与扩展字母')"><button v-for="char in layout.extra" :key="char" @click="edit(key(char))">{{ key(char) }}</button></div>
      <KanaKeyboard v-if="language === 'ja' && japaneseMode === 'kana' && !symbols" :katakana="katakana" @input="edit" @modify="modifyKana" />
      <div v-for="(row, index) in (language === 'ja' && japaneseMode === 'kana' && !symbols ? [] : rows)" :key="index" class="key-row"><button v-for="char in row" :key="char" class="letter" @click="edit(symbols ? char : key(char))">{{ symbols ? char : key(char) }}</button></div>
      <div class="key-row"><button class="function" :class="{ active: symbols ? symbolPage : language === 'ja' ? katakana : shift || caps }" :aria-label="t(symbols ? '切换符号页' : language === 'ja' ? '切换平假名与片假名' : language === 'ka' ? '切换格鲁吉亚语扩展字母' : language === 'ko' ? '切换双辅音与扩展元音' : '切换大小写')" :aria-pressed="symbols ? symbolPage : language === 'ja' ? katakana : shift || caps" @click="toggleShift">{{ symbols ? (symbolPage ? '123' : '#+=') : language === 'ja' ? (katakana ? 'カナ' : 'かな') : '⇧' }}</button><button v-if="!symbols && language !== 'ko' && language !== 'ja' && language !== 'ka'" class="function" :class="{ active: caps }" :aria-label="t('大写锁定')" :aria-pressed="caps" @click="caps = !caps; shift = false">⇪</button><button class="function" :aria-pressed="symbols" :aria-label="t(symbols ? '字母' : '符号')" @click="toggleSymbols">{{ symbols ? t('字母') : '123' }}</button><button class="space" @click="edit(' ')">{{ t('空格') }}</button><button class="function" :aria-label="t('删除字符')" @click="edit('', true)">⌫</button><button class="function" :aria-label="t('换行')" @click="edit('\n')">↵</button></div>
    </section>
  </main>
</template>
