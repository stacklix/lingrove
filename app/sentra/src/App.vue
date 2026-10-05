<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { createID, isNative, ready, setRootPage, moduleStorage } from '@lingrove/host-sdk';
import {
  actions,
  defaults,
  languages,
  type Action,
  type Result,
  type Sentence,
  type Settings,
} from './models';
import { analyze } from './api';
import { partialResult } from './partial';
import ResultView from './components/ResultView.vue';
import CopyButton from './components/CopyButton.vue';
import Sheet from './components/Sheet.vue';
const storage = moduleStorage('sentra');
const settings = reactive<Settings>({ ...defaults });
const draftSettings = reactive<Settings>({ ...defaults });
const translationLanguage = ref(defaults.translationLanguage);
const active = ref<Action>('translate');
const panel = ref<'learn' | 'history' | 'settings'>('learn');
const sheetPanel = ref<'history' | 'settings'>('history');
watch(
  () => panel.value === 'learn',
  (isRoot) => {
    void setRootPage(isRoot).catch(() => {});
  },
  { immediate: true },
);
watch(panel, (value) => {
  if (value !== 'learn') sheetPanel.value = value;
});
const pageScroll = ref<HTMLElement>();
const sentenceInput = ref<HTMLTextAreaElement>();
const composing = ref(false);
watch(active, () => {
  if (pageScroll.value) pageScroll.value.scrollTop = 0;
});
const history = ref<Sentence[]>([]);
const search = ref('');
const notice = ref('');
const loaded = ref(false);
const historyWritable = ref(true);
const saving = ref(false);
const actionLabels = {
  translate: ['开始翻译', '重新翻译'],
  grammar: ['分析语法', '重新分析'],
  improve: ['优化表达', '重新优化'],
};
const navIcons = {
  translate: 'M4 5h12M10 3v2M6 5c0 6 6 10 10 11M14 5c0 6-6 10-10 11M15 21l4-10 4 10M17 17h4',
  grammar: 'M5 4h14v17l-7-4-7 4zM8 8h8M8 12h5',
  improve: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
};
const deleting = reactive(new Set<string>());
const tabs = reactive(
  Object.fromEntries(
    actions.map((a) => [
      a.id,
      {
        text: '',
        result: null as Result | null,
        progress: '',
        busy: false,
        error: '',
        controller: null as AbortController | null,
      },
    ]),
  ) as Record<
    Action,
    {
      text: string;
      result: Result | null;
      progress: string;
      busy: boolean;
      error: string;
      controller: AbortController | null;
    }
  >,
);
const tab = computed(() => tabs[active.value]);
async function confirmInput(event: KeyboardEvent) {
  if (
    event.key !== 'Enter' ||
    event.shiftKey ||
    event.isComposing ||
    event.keyCode === 229 ||
    composing.value
  )
    return;
  event.preventDefault();
  const input = sentenceInput.value;
  if (!input || !input.value.trim() || tab.value.busy || !loaded.value || !historyWritable.value)
    return;
  input.blur();
  await nextTick();
  tab.value.text = input.value;
  await run();
}
const preview = computed(() =>
  tab.value.busy ? partialResult(tab.value.progress) : tab.value.result?.data,
);
const filtered = computed(() =>
  history.value.filter((s) =>
    `${s.text} ${JSON.stringify(s.results)}`.toLowerCase().includes(search.value.toLowerCase()),
  ),
);
let writeQueue = Promise.resolve();
function persistHistory() {
  const snapshot = JSON.parse(JSON.stringify(history.value));
  const next = writeQueue.catch(() => {}).then(() => storage.set('history', snapshot));
  writeQueue = next;
  return next;
}
onMounted(async () => {
  try {
    const prefs = await storage.get<Partial<Settings>>('preferences');
    for (const key of ['translationLanguage', 'explanationLanguage', 'level'] as const) {
      if (typeof prefs?.[key] === 'string') settings[key] = prefs[key];
    }
    if (!languages.includes(settings.translationLanguage)) settings.translationLanguage = '英语';
    translationLanguage.value = settings.translationLanguage;
  } catch {
    notice.value = '设置读取失败，请重新配置。';
  }
  try {
    const saved = await storage.get<Sentence[]>('history');
    if (
      saved &&
      (!Array.isArray(saved) ||
        saved.some((s) => typeof s.text !== 'string' || !Array.isArray(s.results)))
    )
      throw new Error();
    history.value = saved ?? [];
  } catch {
    historyWritable.value = false;
    notice.value = '记录读取失败，已停止写入以保护原数据。请重新打开。';
  }
  loaded.value = true;
  try {
    await ready();
  } catch {
    notice.value = '宿主初始化失败，请返回后重试。';
  }
});
function openSettings() {
  Object.assign(draftSettings, settings);
  panel.value = 'settings';
}
async function saveSettings() {
  saving.value = true;
  notice.value = '';
  try {
    await storage.set('preferences', { ...draftSettings });
    if (settings.translationLanguage !== draftSettings.translationLanguage) {
      translationLanguage.value = draftSettings.translationLanguage;
    }
    Object.assign(settings, draftSettings);
    panel.value = 'learn';
  } catch (e) {
    notice.value = message(e);
  } finally {
    saving.value = false;
  }
}
function message(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
async function run() {
  const action = active.value,
    current = tabs[action],
    text = current.text.trim();
  if (!text || current.busy || !loaded.value || !historyWritable.value) return;
  if (text.length > 4000) {
    current.error = '每次最多输入 4000 个字符';
    return;
  }
  const config = {
    ...settings,
    translationLanguage:
      action === 'translate' ? translationLanguage.value : settings.translationLanguage,
  };
  current.busy = true;
  current.error = '';
  current.progress = '';
  current.result = null;
  const controller = new AbortController();
  current.controller = controller;
  try {
    const result = await analyze(action, text, config, controller.signal, (value) => {
      current.progress = value;
    });
    if (controller.signal.aborted) return;
    current.result = result;
    history.value.unshift({
      id: createID(),
      text,
      translationLanguage: config.translationLanguage,
      explanationLanguage: config.explanationLanguage,
      level: config.level,
      createdAt: result.createdAt,
      results: [result],
      learningVersion: 3,
    });
    try {
      await persistHistory();
    } catch {
      notice.value = '结果已生成，但保存失败。请释放空间后点击重试保存。';
    }
  } catch (e) {
    current.error = controller.signal.aborted ? '已停止生成，未完成结果不会保存。' : message(e);
  } finally {
    current.busy = false;
    current.controller = null;
  }
}
async function retrySave() {
  try {
    await persistHistory();
    notice.value = '记录已保存';
  } catch {
    notice.value = '保存失败，请检查可用空间';
  }
}
function openSentence(s: Sentence) {
  const result = s.results.find((r) => r.action === active.value) ?? s.results[0];
  if (!result) return;
  const t = tabs[result.action];
  if (t.busy) {
    notice.value = '请先停止该页面的生成，再打开记录';
    return;
  }
  active.value = result.action;
  t.text = s.text;
  t.result = result;
  t.error = '';
  panel.value = 'learn';
}
async function removeSentence(s: Sentence) {
  if (!historyWritable.value || deleting.has(s.id)) return;
  deleting.add(s.id);
  history.value = history.value.filter((x) => x.id !== s.id);
  try {
    await persistHistory();
  } catch {
    if (!history.value.some((x) => x.id === s.id)) history.value.push(s);
    history.value.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    notice.value = '删除保存失败，请重试';
  } finally {
    deleting.delete(s.id);
  }
}
</script>
<template>
  <div class="shell" :class="{ 'native-host': isNative() }">
    <nav class="top-actions" aria-label="页面工具">
      <button
        data-action="history"
        :aria-current="panel === 'history' ? 'page' : undefined"
        :class="{ selected: panel === 'history' }"
        @click="panel = 'history'"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16v15H4zM8 3v4M16 3v4M8 11h8M8 15h5" />
        </svg>
        <span>记录</span>
      </button>
      <button
        data-action="settings"
        :aria-current="panel === 'settings' ? 'page' : undefined"
        :class="{ selected: panel === 'settings' }"
        @click="openSettings"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16M8 4v6M16 14v6" /></svg>
        <span>设置</span>
      </button>
    </nav>
    <div ref="pageScroll" class="page-scroll">
      <div v-if="notice && panel === 'learn'" class="notice" role="status">
        {{ notice }}
        <button v-if="notice.includes('保存失败')" class="text-button" @click="retrySave">
          重试保存</button
        ><button aria-label="关闭提示" @click="notice = ''">×</button>
      </div>
      <Transition name="page-switch" mode="out-in">
        <main :key="active" class="workspace">
          <section class="input-column">
            <div class="section-label">YOUR DAILY LANGUAGE SPACE</div>
            <div class="editor">
              <div class="card-top">
                <label for="sentence">你的句子</label
                ><CopyButton :text="tab.text" :disabled="!tab.text" />
              </div>
              <textarea
                id="sentence"
                ref="sentenceInput"
                v-model="tab.text"
                :disabled="tab.busy"
                maxlength="4000"
                placeholder="输入想理解或表达的一句话…"
                enterkeyhint="done"
                @compositionstart="composing = true"
                @compositionend="composing = false"
                @keydown="confirmInput"
                @input="tab.result = null"
              />
              <div class="editor-footer">
                <span>{{ tab.text.length }} / 4000</span
                ><button
                  class="text-button"
                  :disabled="tab.busy"
                  @click="
                    tab.text = '';
                    tab.result = null;
                    tab.error = '';
                  "
                >
                  清空
                </button>
              </div>
            </div>
            <div class="controls">
              <label v-if="active === 'translate'" class="translation-language"
                >翻译为
                <span class="language-select">
                  <select v-model="translationLanguage" :disabled="tab.busy">
                    <option v-for="l in languages" :key="l">{{ l }}</option>
                  </select>
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="m4 6 4 4 4-4" />
                  </svg> </span></label
              ><span v-else class="muted">直接分析原句，保留原文语言</span
              ><button v-if="tab.busy" class="primary stop" @click="tab.controller?.abort()">
                停止生成</button
              ><button
                v-else
                class="primary"
                :disabled="!tab.text.trim() || !loaded || !historyWritable"
                @click="run"
              >
                {{ actionLabels[active][tab.result ? 1 : 0] }} <span>↗</span>
              </button>
            </div>
            <div class="quiet-note">
              <span class="dot"></span
              >{{ isNative() ? '记录保存在这台设备' : '记录保存在当前浏览器' }}
              <p>每天一句，让语言慢慢成为你的习惯。</p>
            </div>
          </section>
          <section class="output-column" aria-label="学习结果" aria-live="polite">
            <div class="card-top output-heading">
              <span class="section-label">学习笔记</span
              ><span v-if="tab.busy" class="generating"
                >● {{ tab.progress ? '正在生成' : '正在连接' }}</span
              ><CopyButton
                v-else-if="tab.result"
                :text="JSON.stringify(tab.result.data, null, 2)"
                label="复制完整结果"
              />
            </div>
            <div v-if="tab.error" class="error" role="alert">{{ tab.error }}</div>
            <ResultView
              v-if="preview && Object.keys(preview).length"
              :action="active"
              :data="preview"
            />
            <div v-else class="empty">
              <div class="empty-art">Aa<span>あ</span></div>
              <h2>{{ tab.busy ? '正在琢磨这句话…' : '好表达，从一句话开始' }}</h2>
              <p>
                {{
                  tab.busy
                    ? '结果会逐步出现在这里。'
                    : '写下一个句子，探索它的意思、结构和更多可能。'
                }}
              </p>
              <div class="empty-line"></div>
            </div>
          </section>
        </main>
      </Transition>
      <footer>SENTRA <span>把世界，读成自己的语言。</span></footer>
    </div>
    <nav class="bottom-nav" aria-label="主导航">
      <button
        v-for="a in actions"
        :key="a.id"
        :data-action="a.id"
        :aria-current="panel === 'learn' && active === a.id ? 'page' : undefined"
        :class="{ selected: panel === 'learn' && active === a.id }"
        @click="
          active = a.id;
          panel = 'learn';
        "
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="navIcons[a.id]" /></svg>
        <span>{{ a.label }}</span>
      </button>
    </nav>
    <Sheet
      :open="panel !== 'learn'"
      :title="sheetPanel === 'history' ? '记录' : '设置'"
      :save-form="sheetPanel === 'settings' ? 'connection-settings' : undefined"
      :saving="saving"
      @close="panel = 'learn'"
    >
      <div v-if="notice" class="notice" role="status">
        {{ notice }}<button aria-label="关闭提示" @click="notice = ''">×</button>
      </div>
      <main v-if="sheetPanel === 'history'" key="history" class="page">
        <div class="page-heading">
          <div>
            <span class="section-label">YOUR COLLECTION</span>
            <h1>学过的每一句，都在这里。</h1>
          </div>
        </div>
        <input
          v-model="search"
          class="search"
          aria-label="搜索记录"
          placeholder="搜索句子或学习笔记…"
        />
        <div v-if="!filtered.length" class="empty">
          <h2>{{ search ? '没有找到相关记录' : '你的第一句，值得留下' }}</h2>
          <p>完成一次学习，结果会自动保存在这里。</p>
        </div>
        <article v-for="s in filtered" :key="s.id" class="history-card">
          <button class="history-open" @click="openSentence(s)">
            <span class="eyebrow"
              >{{ actions.find((a) => a.id === s.results[0]?.action)?.label }} ·
              {{ new Date(s.createdAt).toLocaleDateString() }}</span
            >
            <p>{{ s.text }}</p></button
          ><button class="text-button danger" aria-label="删除记录" @click="removeSentence(s)">
            删除
          </button>
        </article>
      </main>
      <main v-else key="settings" class="page settings">
        <span class="section-label">MAKE IT YOURS</span>
        <h1>学习偏好</h1>
        <form id="connection-settings" @submit.prevent="saveSettings">
          <fieldset>
            <legend>学习偏好</legend>
            <label
              >解释语言<select v-model="draftSettings.explanationLanguage">
                <option>简体中文</option>
                <option>英语</option>
                <option>日语</option>
              </select></label
            ><label
              >学习水平<select v-model="draftSettings.level">
                <option>初级</option>
                <option>中级</option>
                <option>高级</option>
              </select></label
            ><label
              >默认翻译语言<select v-model="draftSettings.translationLanguage">
                <option v-for="l in languages" :key="l">{{ l }}</option>
              </select></label
            >
          </fieldset>
        </form>
      </main>
    </Sheet>
  </div>
</template>
