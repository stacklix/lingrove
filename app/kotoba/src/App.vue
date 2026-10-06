<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t } = useAppI18n();
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { isNative, ready, setRootPage, formatLLMStatus, type LLMStatus } from '@lingrove/host-sdk';
import { lookup } from './api';
import { demo } from './demo';
import GrammarGuide from './components/GrammarGuide.vue';
import { installFocusMode } from './focus';
import { validateInput, type Entry } from './model';
let removeFocusMode: (() => void) | undefined;
onMounted(() => {
  removeFocusMode = installFocusMode();
});
onUnmounted(() => removeFocusMode?.());
const input = ref('');
const page = ref<'search' | 'result' | 'grammar'>('search');
watch(page, (value) => {
  void setRootPage(value !== 'result').catch(() => {});
  document.documentElement.scrollTop = 0;
});
function switchTab(destination: 'search' | 'grammar') {
  if (page.value === destination) return;
  cancel();
  error.value = '';
  notice.value = '';
  page.value = destination;
}
function backToSearch() {
  cancel();
  error.value = '';
  notice.value = '';
  page.value = 'search';
}
const result = ref<Entry | null>(null);
const busy = ref(false);
const error = ref('');
const notice = ref('');
const preview = ref(false);
const readings = ref(true);
const received = ref(0);
const requestStatus = ref<LLMStatus>();
const incomplete = ref(false);
const groups = computed(
  () =>
    result.value?.schoolForms.map((group) => ({
      ...group,
      forms: result.value!.forms.filter((form) => form.schoolForm === group.label),
    })) ?? [],
);
const selectedSchoolForm = ref('');
const group = computed(
  () =>
    groups.value.find((item) => item.label === selectedSchoolForm.value) ??
    groups.value.find((item) => item.forms.length) ??
    groups.value[0],
);
function navigateTabs(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = Array.from(
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  );
  const current = tabs.indexOf(event.target as HTMLButtonElement);
  const index =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  selectedSchoolForm.value = groups.value[index].label;
  tabs[index].focus();
}
let controller: AbortController | undefined;
const composing = ref(false);
onMounted(async () => {
  try {
    await ready();
    await setRootPage(page.value !== 'result');
  } catch {
    notice.value = '宿主初始化失败，请返回后重新打开。';
  }
});
onUnmounted(() => controller?.abort());
function cancel() {
  controller?.abort();
  controller = undefined;
  busy.value = false;
  if (result.value && incomplete.value) notice.value = '查询已取消，以下仅为已收到的部分结果。';
}
function showDemo() {
  cancel();
  selectedSchoolForm.value = '';
  incomplete.value = false;
  notice.value = '';
  input.value = '食べる';
  result.value = demo;
  page.value = 'result';
  preview.value = true;
  error.value = '';
}
async function search() {
  if (busy.value || composing.value) return;
  error.value = '';
  try {
    input.value = validateInput(input.value);
  } catch (e) {
    error.value = (e as Error).message;
    return;
  }
  page.value = 'result';
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  result.value = null;
  received.value = 0;
  selectedSchoolForm.value = '';
  incomplete.value = false;
  notice.value = '';
  preview.value = false;
  const request = new AbortController();
  controller = request;
  busy.value = true;
  requestStatus.value = undefined;
  try {
    const entry = await lookup(
      input.value,
      request.signal,
      (entry, characters) => {
        if (controller !== request || request.signal.aborted) return;
        received.value = characters;
        if (entry) {
          result.value = entry;
          incomplete.value = true;
        }
      },
      (status) => {
        if (controller === request && !request.signal.aborted) requestStatus.value = status;
      },
    );
    if (controller === request) {
      result.value = entry;
      incomplete.value = false;
    }
  } catch (e) {
    if (controller === request && !request.signal.aborted)
      error.value = e instanceof Error ? e.message : '查询失败，请重试。';
  } finally {
    if (controller === request) {
      busy.value = false;
      controller = undefined;
    }
  }
}
</script>

<template>
  <main :class="{ 'native-host': isNative(), 'result-page': page === 'result' }">
    <nav v-if="page === 'result'" class="result-navigation" :aria-label="t('页面工具')">
      <button type="button" class="page-back" :aria-label="t('返回查询')" @click="backToSearch">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <h2 lang="ja">{{ input }}</h2>
    </nav>
    <KeepAlive><GrammarGuide v-if="page === 'grammar'" /></KeepAlive>
    <template v-if="page === 'search'">
      <section class="intro">
        <p class="eyebrow">{{ t('一个单词，更多表达') }}</p>
        <h1>{{ t('从原形，到每一种用法。') }}</h1>
        <p class="subtitle">{{ t('输入日语单词，用活用和例句理解它的变化。') }}</p>
      </section>
      <section class="search-panel" :aria-label="t('查询单词')">
        <form @submit.prevent="search">
          <label for="word">{{ t('想了解哪个单词？') }}</label>
          <div class="input-row">
            <input
              id="word"
              v-model="input"
              lang="ja"
              maxlength="40"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              :placeholder="t('例如：食べる、行く、高い')"
              :disabled="busy"
              @compositionstart="composing = true"
              @compositionend="composing = false"
              @keydown.enter="
                ($event.isComposing || composing || $event.keyCode === 229) &&
                $event.preventDefault()
              "
            /><button class="primary" type="submit" :disabled="busy || !input.trim()">
              {{ t(busy ? '查询中…' : '查看活用') }}<span v-if="!busy" aria-hidden="true"> ↗</span>
            </button>
          </div>
        </form>
        <div class="search-footer">
          <span>{{ t('动词 · い形容词 · な形容词') }}</span
          ><button type="button" class="text-button" @click="showDemo">
            {{ t('试试「食べる」示例 →') }}
          </button>
        </div>
      </section>
    </template>
    <p v-if="notice" class="message" role="status">{{ t(notice) }}</p>
    <div v-if="error" class="message error" role="alert">
      <strong>{{ t('暂时无法查询') }}</strong>
      <p>{{ t(error) }}</p>
      <button class="text-button" @click="search">{{ t('重新查询 →') }}</button>
    </div>
    <div v-if="busy" class="loading" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <div>
        <strong>{{ t('正在整理活用与例句') }}</strong>
        <p>{{ t(formatLLMStatus(requestStatus)) }}</p>
        <p>
          {{
            t(
              result
                ? `已显示 ${result.forms.length} 项，正在继续生成…`
                : received
                  ? `已收到 ${received} 字符，正在整理首批条目…`
                  : '正在查询…',
            )
          }}
        </p>
      </div>
      <button class="text-button" @click="cancel">{{ t('取消') }}</button>
    </div>
    <template v-if="page === 'result' && result">
      <section class="word-summary" :aria-label="t('单词释义')">
        <div>
          <span class="badge">{{ t(result.type) }}</span>
          <p v-if="readings" class="word-reading" lang="ja">{{ result.reading }}</p>
          <h2 lang="ja">{{ result.word }}</h2>
          <p class="meaning">{{ preview ? t(result.meaning) : result.meaning }}</p>
        </div>
        <p v-if="result.note" class="note">{{ preview ? t(result.note) : result.note }}</p>
      </section>
      <p class="source">
        {{
          t(
            preview
              ? '内置示例 · 可离线查看'
              : incomplete
                ? '部分结果 · 尚未完成，请勿视为完整活用表'
                : '特殊用法请结合语境核对',
          )
        }}<span v-if="!result.inflectable"> {{ t('· 此词无活用，以下展示原形例句') }}</span>
      </p>
      <div class="toolbar">
        <span class="grammar-hierarchy">{{ t('学校文法 → 教育文法') }}</span>
        <label class="reading-toggle"
          ><input v-model="readings" type="checkbox" />{{ t('显示读音') }}</label
        >
      </div>
      <div
        class="school-tabs"
        role="tablist"
        :aria-label="t('学校文法活用形')"
        @keydown="navigateTabs"
      >
        <button
          v-for="item in groups"
          :id="`school-tab-${item.label}`"
          :key="item.label"
          type="button"
          role="tab"
          :aria-selected="group?.label === item.label"
          :aria-controls="`school-panel-${item.label}`"
          :tabindex="group?.label === item.label ? 0 : -1"
          @click="selectedSchoolForm = item.label"
        >
          {{ t(item.label) }}
        </button>
      </div>
      <section
        v-if="group"
        :id="`school-panel-${group.label}`"
        class="school-group"
        role="tabpanel"
        :aria-labelledby="`school-tab-${group.label}`"
        tabindex="0"
      >
        <div class="school-heading">
          <span class="grammar-level">{{
            t(['派生表达', '无活用'].includes(group.label) ? '补充说明' : '学校文法')
          }}</span>
          <h3>
            {{ t(group.label) }} <span lang="ja">{{ group.word }}</span>
          </h3>
          <p v-if="readings" class="kana" lang="ja">{{ group.reading }}</p>
          <p class="usage">{{ preview ? t(group.usage) : group.usage }}</p>
        </div>
        <p v-if="group.forms.length" class="grammar-level">{{ t('教育文法 · 常用形式与例句') }}</p>
        <p v-if="!group.forms.length && busy" class="grammar-level">
          {{ t('此活用形的例句正在生成… ·') }} {{ t(formatLLMStatus(requestStatus)) }}
        </p>
        <div class="results">
          <article v-for="(form, index) in group.forms" :key="form.label" class="form-card">
            <div class="card-top">
              <span class="form-label">{{ t(form.label) }}</span
              ><span class="number">{{ t(String(index + 1).padStart(2, '0')) }}</span>
            </div>
            <p v-if="readings" class="kana" lang="ja">{{ form.reading }}</p>
            <h4 lang="ja">{{ form.word }}</h4>
            <p class="usage">{{ preview ? t(form.usage) : form.usage }}</p>
            <div class="example">
              <p lang="ja" class="sentence">{{ form.example }}</p>
              <p v-if="readings" lang="ja" class="example-reading">{{ form.exampleReading }}</p>
              <p class="translation">{{ preview ? t(form.translation) : form.translation }}</p>
            </div>
          </article>
        </div>
      </section>
    </template>
    <section v-else-if="page === 'search' && !error" class="empty">
      <span class="empty-character" lang="ja">あ</span>
      <h2>{{ t('让单词，变成表达。') }}</h2>
      <p>
        {{ t('从「食べる」到「食べたい」的日语世界，') }}<br />{{ t('从了解一个单词的变化开始。') }}
      </p>
      <div class="steps">
        <span>{{ t('01 识别词性') }}</span
        ><span>{{ t('02 查看活用') }}</span
        ><span>{{ t('03 读懂例句') }}</span>
      </div>
    </section>
    <div v-if="page === 'result' && !busy && !result && !error" class="empty">
      <p>{{ t('查询已取消') }}</p>
      <button class="text-button" @click="search">{{ t('重新查询 →') }}</button>
    </div>
    <footer v-if="page === 'search' && !isNative()">
      {{ t('浏览器支持内置示例；任意单词查询请在 Lingrove 中使用。') }}
    </footer>
  </main>
  <nav class="bottom-tabs" :aria-label="t('主导航')">
    <button
      type="button"
      :class="{ active: page !== 'grammar' }"
      :aria-current="page !== 'grammar' ? 'page' : undefined"
      @click="switchTab('search')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15M16 16l5 5" /></svg
      ><span>{{ t('单词查询') }}</span>
    </button>
    <button
      type="button"
      :class="{ active: page === 'grammar' }"
      :aria-current="page === 'grammar' ? 'page' : undefined"
      @click="switchTab('grammar')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h6q2 0 2 2q0-2 2-2h6v14h-6q-2 0-2 2q0-2-2-2H4z M12 7v14" /></svg
      ><span>{{ t('活用语法') }}</span>
    </button>
  </nav>
</template>
