<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { ready, createID, isNative, setRootPage } from '@lingrove/host-sdk';
import {
  glyphs,
  languages,
  groups,
  poolFor,
  type Glyph,
  type Language,
  type Group,
} from './curriculum';
import { makeRound, summarize, type Question, type Answer } from './session';
import { assess, type Strokes, type Assessment, type Mask } from './scoring';
import { loadFonts, template, raster, mask } from './render';
import { loadHistory, saveHistory, type History, type RoundRecord } from './persistence';
import GlyphView from './components/GlyphView.vue';
import WritingPad from './components/WritingPad.vue';
import StrokeOrder from './components/StrokeOrder.vue';
import PronunciationButton from './components/PronunciationButton.vue';
import { stopPronunciation } from './pronunciation';
import PronunciationCredits from './components/PronunciationCredits.vue';
import { emptyProgress, loadProgress, saveProgress, type Tab } from './progress';
const progress = ref(emptyProgress());
const progressWritable = ref(false);
const tab = ref<Tab>('study');
const learnParent = ref<'home' | 'progress' | 'library' | 'summary' | 'test-home'>('home');
const detail = ref<Glyph | null>(null);
const reviewAnswer = ref<Answer | null>(null);
function variants(current: Glyph): Glyph[] {
  if (current.language === 'ja') {
    return glyphs.filter((g) => g.language === 'ja' && g.name === current.name);
  }
  return [current.text.toUpperCase(), current.text.toLowerCase()]
    .map((text) => glyphs.find((g) => g.language === current.language && g.text === text))
    .filter((g): g is Glyph => !!g);
}
const detailCases = computed(() => (detail.value ? variants(detail.value) : []));
const variantLabel = (g: Glyph) =>
  ({ upper: '大写', lower: '小写', hiragana: '平假名', katakana: '片假名', mixed: '' })[g.group];
const sequential = ref(false);
const stage = ref<'observe' | 'trace' | 'write'>('observe');
const currentInk = ref<Strokes>([]);
const currentDrawing = ref<string | undefined>();
const testScope = ref<'learned' | 'all'>('learned');
const cursorKey = computed(() => `${language.value}:mixed`);
const learned = computed(() => new Set(progress.value.learned));
const learnedPool = computed(() => pool.value.filter(letterLearned));
const cursor = computed(() => progress.value.cursors[cursorKey.value]);
const nextStudy = computed(
  () =>
    studyPool.value.find((g) => g.id === cursor.value?.id && !learned.value.has(g.id)) ??
    studyPool.value.find((g) => !learned.value.has(g.id)) ??
    studyPool.value[0],
);
const languageRounds = computed(() =>
  history.value.rounds
    .filter((r) => glyphs.find((g) => g.id === r.answers[0]?.id)?.language === language.value)
    .slice()
    .reverse(),
);
const totalScore = (record: RoundRecord) =>
  Math.round(record.answers.reduce((sum, a) => sum + a.score, 0) / record.answers.length);
async function persistProgress() {
  if (!progressWritable.value) return;
  progress.value.lastGroups[language.value] = group.value;
  progress.value.language = language.value;
  progress.value.tab = tab.value;
  try {
    await saveProgress(progress.value);
  } catch (e) {
    notice.value = `进度保存失败：${message(e)}`;
  }
}
function capture() {
  if (page.value === 'learn' && sequential.value) {
    progress.value.cursors[cursorKey.value] = {
      id: activeID.value,
      stage: stage.value,
      strokes: currentInk.value,
      drawing: currentDrawing.value,
      feedback: feedback.value,
    };
  }
  if (page.value === 'test') {
    progress.value.drafts[language.value] = {
      id: roundID.value,
      group: group.value,
      questions: round.value,
      answers: answers.value,
      index: questionIndex.value,
      strokes: currentInk.value,
      drawing: currentDrawing.value,
      feedback: feedback.value,
      selected: selected.value,
    };
  }
}
function inkChanged(strokes: Strokes, drawing?: string) {
  if (busy.value || feedback.value) return;
  currentInk.value = strokes;
  currentDrawing.value = drawing;
  if (page.value === 'learn') feedback.value = null;
  capture();
  void persistProgress();
}
function switchTab(value: Tab) {
  if (busy.value) return;
  capture();
  tab.value = value;
  detail.value = null;
  page.value = value === 'study' ? 'home' : value === 'tests' ? 'test-home' : 'library';
  resetFeedback();
  void persistProgress();
}
function continueStudy(g = nextStudy.value) {
  const saved = cursor.value;
  sequential.value = g.id === nextStudy.value.id;
  learn(g, sequential.value);
  if (sequential.value && saved?.id === g.id) {
    stage.value = saved.stage === 'observe' ? 'trace' : saved.stage;
    tracing.value = stage.value === 'trace';
    currentInk.value = saved.strokes;
    currentDrawing.value = saved.drawing;
    feedback.value = saved.feedback;
    if (saved.strokes.length) lastInk.value = raster(saved.strokes).toDataURL();
  }
  capture();
  void persistProgress();
}
function resumeRound() {
  const d = progress.value.drafts[language.value];
  if (!d) return;
  group.value = d.group;
  round.value = d.questions;
  answers.value = [...d.answers];
  roundID.value = d.id;
  questionIndex.value = d.index;
  resetFeedback();
  currentInk.value = d.strokes;
  currentDrawing.value = d.drawing;
  feedback.value = d.feedback;
  selected.value = d.selected;
  if (d.strokes.length) lastInk.value = raster(d.strokes).toDataURL();
  tab.value = 'tests';
  tracing.value = false;
  page.value = 'test';
}

const page = ref<
  'home' | 'library' | 'learn' | 'test' | 'summary' | 'history' | 'test-home' | 'progress'
>('home');
const isRootPage = computed(
  () =>
    ['home', 'library', 'test-home'].includes(page.value) && !detail.value && !reviewAnswer.value,
);
watch(
  isRootPage,
  (isRoot) => {
    void setRootPage(isRoot).catch(() => {});
  },
  { immediate: true },
);
const pageTitle = computed(
  () =>
    ({
      progress: '学习进度',
      learn: '字母学习',
      test: '字母测试',
      summary: '测试结果',
      history: '测试记录',
    })[page.value as 'progress' | 'learn' | 'test' | 'summary' | 'history'] ?? '',
);
const backLabel = computed(() =>
  page.value === 'progress'
    ? '返回学习首页'
    : page.value === 'summary'
      ? '返回测试'
      : page.value === 'test'
        ? '保存并返回测试'
        : '保存并返回',
);
function backPage() {
  if (busy.value) return;
  if (page.value === 'progress') switchTab('study');
  else if (page.value === 'summary') switchTab('tests');
  else leave();
}
const language = ref<Language>('ru'),
  group = ref<Group>('mixed');
const activeID = ref('ru-а'),
  tracing = ref(false),
  overlay = ref(false);
const fontsReady = ref(false),
  loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  historyWritable = ref(false);
const history = ref<History>({ practices: [], rounds: [] });
const round = ref<Question[]>([]),
  answers = ref<Answer[]>([]),
  questionIndex = ref(0),
  roundID = ref('');
const feedback = ref<Assessment | null>(null),
  selected = ref<string | null>(null),
  lastInk = ref('');
const pad = ref<InstanceType<typeof WritingPad>>();
const pool = computed(() =>
  poolFor(language.value, language.value === 'ru' ? 'mixed' : group.value),
);
const studyPool = computed(() => poolFor(language.value, 'mixed'));
const letterCards = computed(() =>
  language.value === 'ja'
    ? studyPool.value.filter((g) => g.group === 'hiragana')
    : studyPool.value.filter((g) => g.group === 'lower'),
);
const libraryCards = computed(() =>
  language.value === 'ja'
    ? pool.value
    : language.value === 'el'
      ? glyphs.filter((g) => g.language === 'el' && g.group === 'lower')
      : letterCards.value,
);
function libraryPair(g: Glyph) {
  return g.language === 'ja' ? [g] : g.language === 'el' && g.text !== 'ς' ? variants(g) : pair(g);
}
const libraryCells = computed(() => {
  if (language.value !== 'ja') return libraryCards.value;
  const rows = [
    'a i u e o',
    'ka ki ku ke ko',
    'sa shi su se so',
    'ta chi tsu te to',
    'na ni nu ne no',
    'ha hi fu he ho',
    'ma mi mu me mo',
    'ya _ yu _ yo',
    'ra ri ru re ro',
    'wa _ _ _ wo',
    'n _ _ _ _',
  ];
  return rows
    .join(' ')
    .split(' ')
    .map((name) => libraryCards.value.find((g) => g.name === name) ?? null);
});
function pair(g: Glyph) {
  if (g.language === 'ja' || (g.language === 'el' && g.text !== 'ς')) return variants(g);
  return g.language === 'ru'
    ? glyphs
        .filter(
          (item) => item.language === 'ru' && item.text.toLowerCase() === g.text.toLowerCase(),
        )
        .slice()
        .reverse()
    : [g];
}
function letterLearned(g: Glyph) {
  return pair(g).every((item) => learned.value.has(item.id));
}
const learnedLetters = computed(() => letterCards.value.filter(letterLearned).length);
function studyLetter(g: Glyph) {
  continueStudy(pair(g).find((item) => !learned.value.has(item.id)) ?? g);
}
function switchCase(g: Glyph) {
  const mode = tracing.value;
  capture();
  if (g.language !== 'ru' && group.value !== 'mixed') group.value = g.group;
  learn(g, sequential.value);
  tracing.value = mode;
  stage.value = mode ? 'trace' : 'write';
  capture();
  void persistProgress();
}
function setPracticeMode(trace: boolean) {
  if (busy.value || tracing.value === trace) return;
  resetFeedback();
  tracing.value = trace;
  stage.value = trace ? 'trace' : 'write';
  capture();
  void persistProgress();
}

const active = computed(() =>
  page.value === 'test'
    ? round.value[questionIndex.value].glyph
    : glyphs.find((g) => g.id === activeID.value)!,
);
const question = computed(() => round.value[questionIndex.value]);
const languageName = computed(() => languages.find((l) => l.id === language.value)!.name);
const passedStudy = computed(
  () =>
    new Set(
      history.value.practices
        .filter((practice) => !practice.tracing && practice.score >= 80)
        .map((practice) => practice.id),
    ),
);
const canAdvanceStudy = computed(() =>
  pair(active.value).every((g) => passedStudy.value.has(g.id)),
);
const stats = computed(() => summarize(answers.value));
const reviewIDs = computed(() => {
  const outcomes = new Map<string, boolean>();
  const attempts = [
    ...history.value.practices.filter((p) => !p.tracing),
    ...history.value.rounds.flatMap((r) => r.answers.map((a) => ({ ...a, at: r.at }))),
  ].sort((a, b) => a.at.localeCompare(b.at));
  attempts.forEach((a) => outcomes.set(a.id, a.correct));
  return [...outcomes].filter(([, correct]) => !correct).map(([id]) => id);
});
const masks = new Map<string, Mask>();
function glyphMask(g: Glyph) {
  if (!masks.has(g.id)) masks.set(g.id, mask(template(g)));
  return masks.get(g.id)!;
}
async function initialize() {
  loading.value = true;
  error.value = '';
  try {
    await loadFonts();
    fontsReady.value = true;
  } catch (e) {
    error.value = message(e);
  }
  try {
    history.value = await loadHistory();
    historyWritable.value = true;
    progress.value = await loadProgress();
    progress.value.learned = [
      ...new Set([
        ...progress.value.learned,
        ...history.value.practices.filter((p) => !p.tracing && p.score >= 80).map((p) => p.id),
      ]),
    ];
    // A completed record wins if the app closed before removing the draft.
    for (const lang of ['ja', 'ru', 'el'] as const)
      if (history.value.rounds.some((r) => r.id === progress.value.drafts[lang]?.id))
        delete progress.value.drafts[lang];
    language.value = progress.value.language;
    group.value =
      language.value === 'ru'
        ? 'mixed'
        : (progress.value.lastGroups[language.value] ??
          (language.value === 'ja' ? 'hiragana' : 'lower'));
    progressWritable.value = true;
    switchTab(progress.value.tab);
  } catch (e) {
    historyWritable.value = false;
    progressWritable.value = false;
    error.value = message(e);
  }
  loading.value = false;
}
function message(e: unknown) {
  return e instanceof Error ? e.message : '操作暂时失败，请重试。';
}
async function persist() {
  if (!historyWritable.value) {
    notice.value = '历史记录未成功读取，本次结果仅保留在当前页面。';
    return;
  }
  try {
    await saveHistory(history.value);
    notice.value = '';
  } catch (e) {
    notice.value = `记录保存失败：${message(e)}。请点击重试保存。`;
  }
}
function requestLanguage(event: Event) {
  const select = event.target as HTMLSelectElement;
  const id = select.value as Language;
  select.value = language.value;
  if (id === language.value || busy.value) return;
  chooseLanguage(id);
}
function chooseLanguage(id: Language) {
  progress.value.lastGroups[language.value] = group.value;
  capture();
  resetFeedback();
  page.value = 'home';
  language.value = id;
  group.value =
    id === 'ru' ? 'mixed' : (progress.value.lastGroups[id] ?? (id === 'ja' ? 'hiragana' : 'lower'));
  switchTab(tab.value);
}
function resetFeedback() {
  feedback.value = null;
  selected.value = null;
  lastInk.value = '';
  overlay.value = false;
  currentInk.value = [];
  currentDrawing.value = undefined;
}
function learn(g: Glyph, inSequence = false) {
  if (['home', 'progress', 'library', 'summary', 'test-home'].includes(page.value))
    learnParent.value = page.value as typeof learnParent.value;
  sequential.value = inSequence;
  activeID.value = g.id;
  if (!inSequence && group.value !== 'mixed') group.value = g.group;
  resetFeedback();
  stage.value = 'trace';
  tracing.value = true;
  detail.value = null;
  page.value = 'learn';
}
async function completeStudy() {
  if (busy.value || page.value !== 'learn' || !canAdvanceStudy.value) return;
  const index = letterCards.value.findIndex((g) =>
    pair(g).some((item) => item.id === activeID.value),
  );
  for (const glyph of pair(active.value)) {
    if (!learned.value.has(glyph.id)) progress.value.learned.push(glyph.id);
  }
  const next = letterCards.value[index + 1];
  if (next) {
    learn(next, true);
    capture();
  } else {
    delete progress.value.cursors[cursorKey.value];
    sequential.value = false;
    switchTab('study');
  }
  busy.value = true;
  try {
    await persistProgress();
  } finally {
    busy.value = false;
  }
}
function startRound(review = false) {
  if (progress.value.drafts[language.value]) {
    resumeRound();
    return;
  }
  const targets = review || testScope.value === 'all' ? pool.value : learnedPool.value;
  try {
    round.value = makeRound(targets, review ? reviewIDs.value : [], Math.random, pool.value);
  } catch (e) {
    notice.value = message(e);
    return;
  }
  answers.value = [];
  questionIndex.value = 0;
  roundID.value = createID();
  resetFeedback();
  tracing.value = false;
  tab.value = 'tests';
  page.value = 'test';
  capture();
  void persistProgress();
}
function leave() {
  if (page.value === 'learn') {
    capture();
    page.value = learnParent.value;
    resetFeedback();
    void persistProgress();
    return;
  }
  switchTab(tab.value);
}
async function grade(strokes: Strokes) {
  if (busy.value || feedback.value) return;
  busy.value = true;
  error.value = '';
  await nextTick();
  await new Promise((r) => setTimeout(r, 30));
  try {
    const ink = raster(strokes);
    lastInk.value = ink.toDataURL();
    feedback.value = assess(
      mask(ink),
      glyphMask(active.value),
      pool.value
        .filter((g) => g.group === active.value.group)
        .map((g) => ({ id: g.id, mask: glyphMask(g) })),
      active.value.id,
    );
    if (page.value === 'learn') {
      history.value.practices.push({
        id: active.value.id,
        score: feedback.value.score,
        correct: feedback.value.correct,
        tracing: tracing.value,
        at: new Date().toISOString(),
      });
      history.value.practices = history.value.practices.slice(-500);
      if (!tracing.value && feedback.value.score >= 80 && !learned.value.has(active.value.id))
        progress.value.learned.push(active.value.id);
      await persist();
    }
    capture();
    await persistProgress();
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
function choose(id: string) {
  if (feedback.value) return;
  selected.value = id;
  const correct = id === active.value.id;
  feedback.value = {
    score: correct ? 100 : 0,
    correct,
    status: correct ? 'match' : 'different',
    feedback: correct ? '选择正确，记住这个字形。' : '这不是对应的字形。下面是正确的手写范字。',
  };
  capture();
  void persistProgress();
}
async function advance(skip = false) {
  if (!feedback.value || busy.value) return;
  busy.value = true;
  answers.value.push({
    id: active.value.id,
    text: active.value.text,
    score: skip ? 0 : feedback.value.score,
    correct: skip ? false : feedback.value.correct,
    status: skip ? 'skipped' : feedback.value.status,
    ...(question.value.type === 'write'
      ? { type: 'write' as const, strokes: currentInk.value }
      : { type: 'choice' as const, chosenID: selected.value }),
  });
  if (questionIndex.value === 9) {
    history.value.rounds.push({
      id: roundID.value,
      language: languageName.value,
      group: group.value,
      at: new Date().toISOString(),
      answers: [...answers.value],
    });
    history.value.rounds = history.value.rounds.slice(-50);
    await persist();
    delete progress.value.drafts[language.value];
    page.value = 'summary';
  } else {
    questionIndex.value++;
    resetFeedback();
    await nextTick();
    pad.value?.clear();
  }
  capture();
  await persistProgress();
  busy.value = false;
}
function openRecord(record: RoundRecord) {
  answers.value = record.answers;
  const first = glyphs.find((g) => g.id === record.answers[0]?.id)!;
  language.value = first.language;
  group.value = record.group;
  tab.value = 'tests';
  page.value = 'summary';
}
function retry() {
  resetFeedback();
  pad.value?.clear();
  capture();
  void persistProgress();
}
const scoreLabel = computed(() =>
  feedback.value?.status === 'match'
    ? '字形匹配'
    : feedback.value?.status === 'different'
      ? '需要再练习'
      : '暂无法判断',
);
let previousFocus: HTMLElement | null = null;
watch(
  () => !!detail.value || !!reviewAnswer.value,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      await nextTick();
      document.querySelector<HTMLButtonElement>('.dialog-close')?.focus();
    } else {
      document.body.style.overflow = '';
      previousFocus?.focus();
    }
  },
);
watch(group, () => {
  if (!loading.value && ['home', 'library', 'test-home'].includes(page.value))
    void persistProgress();
});
watch([page, activeID, questionIndex], async () => {
  await nextTick();
  window.scrollTo({ top: 0, behavior: 'instant' });
});
watch(page, stopPronunciation);
onBeforeUnmount(() => {
  stopPronunciation();
  document.body.style.overflow = '';
});
onMounted(async () => {
  await ready().catch(() => {});
  await initialize();
});
</script>
<template>
  <div class="app-shell" :class="{ native: isNative() }">
    <nav
      class="page-tools"
      :class="{ 'secondary-toolbar': pageTitle }"
      aria-label="页面工具"
      :inert="!!detail || !!reviewAnswer"
    >
      <template v-if="pageTitle">
        <button class="page-back" :aria-label="backLabel" :disabled="busy" @click="backPage">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
        </button>
        <h2>{{ pageTitle }}</h2>
        <div v-if="page === 'learn'" class="title-actions">
          <button
            v-if="canAdvanceStudy"
            class="next-letter"
            :disabled="busy"
            @click="completeStudy"
          >
            下一个
          </button>
          <button class="text-button writing-help" @click="detail = active">书写方法 ↗</button>
        </div>
      </template>
      <h2 v-if="['home', 'test-home', 'library'].includes(page)" class="tab-title">
        {{ languageName }}{{ page === 'home' ? '学习' : page === 'test-home' ? '测试' : '字母' }}
      </h2>
      <div v-if="isRootPage" class="header-actions">
        <div class="language-select header-icon" :title="`练习语言：${languageName}`">
          <select
            aria-label="练习语言"
            :value="language"
            :disabled="busy || loading || !fontsReady"
            @change="requestLanguage"
          >
            <option v-for="item in languages" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4" ry="9" />
            <path d="M3 12h18" />
          </svg>
        </div>
      </div>
    </nav>
    <main :class="{ 'learning-page': page === 'learn' }" :inert="!!detail || !!reviewAnswer">
      <div v-if="loading" class="loading">正在准备离线字帖…</div>
      <div v-if="error" role="alert" class="error">
        {{ error }} <button @click="initialize" :disabled="busy">重新加载资源</button>
      </div>
      <div v-if="notice" role="status" class="notice">
        {{ notice }}
        <button v-if="historyWritable" @click="persist().then(persistProgress)">重试保存</button>
      </div>
      <template v-if="!loading && fontsReady">
        <template v-if="page === 'home'">
          <section class="study-card">
            <div>
              <span class="eyebrow">{{
                learnedLetters === letterCards.length ? '已完成全部学习' : '下一个未学字形'
              }}</span>
              <h2>{{ nextStudy.name }}</h2>
              <p>已学习 {{ learnedLetters }} / {{ letterCards.length }} 个字母</p>
              <div class="progress-track">
                <i :style="{ width: `${(learnedLetters / letterCards.length) * 100}%` }" />
              </div>
            </div>
            <div class="paired-glyphs">
              <GlyphView v-for="g in pair(nextStudy)" :key="g.id" :glyph="g" />
            </div>
            <div class="study-actions">
              <button @click="page = 'progress'" aria-label="查看学习进度">查看进度</button>
              <button class="primary" @click="continueStudy()">继续学习 →</button>
            </div>
          </section>
          <p class="fine-print">
            查看书写方法，临摹后切换测试并评分，记录学习进度。进度与笔迹自动保存。
          </p>
        </template>
        <template v-else-if="page === 'progress'">
          <section class="tab-intro">
            <p>已学习 {{ learnedLetters }} / {{ letterCards.length }} 个字母</p>
          </section>
          <div class="progress-track" aria-label="学习进度">
            <i :style="{ width: `${(learnedLetters / letterCards.length) * 100}%` }" />
          </div>
          <div class="progress-grid">
            <button
              v-for="g in letterCards"
              :key="g.id"
              :class="{
                learned: letterLearned(g),
                current: pair(g).some((item) => item.id === nextStudy.id),
              }"
              :aria-label="`${pair(g)
                .map((item) => item.text)
                .join(' · ')}，${letterLearned(g) ? '已学习' : '未学习'}`"
              @click="studyLetter(g)"
            >
              <span class="progress-letter">{{
                pair(g)
                  .map((item) => item.text)
                  .join(' · ')
              }}</span>
            </button>
          </div>
        </template>
        <template v-else-if="page === 'test-home'">
          <section class="tab-intro">
            <span class="eyebrow">TEST / 检验进步</span>
            <h1>看看记住了多少。</h1>
            <p>{{ languageName }} · 10 道题，书写和选择交替进行。</p>
          </section>
          <div v-if="language !== 'ru'" class="segments">
            <button
              v-for="item in groups(language)"
              :key="item.id"
              :class="{ active: group === item.id }"
              @click="group = item.id"
            >
              {{ item.name }}
            </button>
          </div>
          <section class="test-entry">
            <label
              >测试范围
              <select v-model="testScope" aria-label="测试范围">
                <option value="learned">已学字母（{{ learnedLetters }}）</option>
                <option value="all">全部字母（{{ letterCards.length }}）</option>
              </select></label
            >
            <p v-if="testScope === 'learned' && !learnedPool.length">
              当前字母组还没有学习记录。先去学习，或选择全部字母测试。
            </p>
            <p v-else-if="testScope === 'learned' && learnedPool.length < 10">
              已学字母不足 10 个，本轮会重复抽取；选择题干扰项来自同组字母。
            </p>
            <button v-if="progress.drafts[language]" class="primary" @click="resumeRound">
              继续本轮 · 第 {{ progress.drafts[language]!.index + 1 }} / 10 题 →
            </button>
            <button
              v-else
              class="primary"
              :disabled="testScope === 'learned' && !learnedPool.length"
              @click="startRound()"
            >
              开始测试 →
            </button>
          </section>
          <div class="test-stats">
            <div>
              <b>{{ languageRounds.length ? totalScore(languageRounds[0]) : '—' }}</b
              ><span>最近成绩</span>
            </div>
            <div>
              <b>{{ languageRounds.length ? Math.max(...languageRounds.map(totalScore)) : '—' }}</b
              ><span>最佳成绩</span>
            </div>
            <div>
              <b>{{ languageRounds.length }}</b
              ><span>完成轮数</span>
            </div>
          </div>
          <div class="section-heading">
            <h2>测试记录</h2>
            <span>总分 / 100</span>
          </div>
          <p v-if="!languageRounds.length" class="empty-state">
            还没有完成的测试。你的第一份成绩，会出现在这里。
          </p>
          <div class="review-list">
            <button v-for="r in languageRounds" :key="r.id" @click="openRecord(r)">
              <span
                >{{ new Date(r.at).toLocaleDateString()
                }}<small>{{ groups(language).find((g) => g.id === r.group)?.name }}</small></span
              ><span
                >书写 {{ summarize(r.answers).writing
                }}<small>选择 {{ summarize(r.answers).choices }}/5</small></span
              ><strong>{{ totalScore(r) }} 分</strong><span>↗</span>
            </button>
          </div>
        </template>
        <template v-else-if="page === 'library'">
          <div v-if="language === 'ja'" class="segments">
            <button
              v-for="item in groups(language)"
              :key="item.id"
              :class="{ active: group === item.id }"
              @click="group = item.id"
            >
              {{ item.name }}
            </button>
          </div>
          <div class="section-heading">
            <span>{{
              language === 'el' ? '24 个字母 · 含词尾 ς' : `${libraryCards.length} 个字母`
            }}</span>
          </div>
          <div class="glyph-grid">
            <template v-for="(g, index) in libraryCells" :key="g?.id ?? `empty-${index}`">
              <span v-if="!g" class="kana-empty" aria-hidden="true"></span>
              <div
                v-else
                class="letter-card"
                :class="{
                  'greek-letter-card': language === 'el',
                  'russian-letter-card': language === 'ru',
                }"
              >
                <button
                  class="glyph-card-open"
                  @click="detail = g"
                  :aria-label="`查看 ${g.name} 的书写说明`"
                >
                  <span v-if="language !== 'ja'" class="print-small">
                    {{
                      pair(g)
                        .map((item) => item.text)
                        .join(' ')
                    }}</span
                  >
                  <div class="paired-glyphs">
                    <GlyphView v-for="item in libraryPair(g)" :key="item.id" :glyph="item" />
                  </div>
                  <small v-if="language !== 'ru'">{{
                    language === 'el' ? g.name.split(' · ')[0] : g.name
                  }}</small>
                </button>
                <PronunciationButton :glyph="g" compact />
              </div>
            </template>
          </div>
        </template>
        <template v-else-if="page === 'learn' || page === 'test'">
          <div v-if="page === 'test'" class="exercise-heading">
            <div>
              <span class="eyebrow">PRACTICE / 小小测验</span>
              <h1>
                {{ question.type === 'write' ? '写出对应的手写体' : '选出对应的手写体' }}
              </h1>
            </div>
            <span v-if="page === 'test'" class="question-counter"
              >{{ questionIndex + 1 }}<small> / 10</small></span
            >
          </div>
          <div v-if="page === 'test'" class="progress-track">
            <i :style="{ width: `${questionIndex * 10}%` }"></i>
          </div>
          <div class="exercise-layout" :class="{ 'study-layout': page === 'learn' }">
            <aside v-if="page === 'test' || tracing" class="reference-panel">
              <div class="letter-examples">
                <div class="printed-example">
                  <span class="eyebrow">{{
                    active.language === 'ja' ? '题目字形' : '印刷体'
                  }}</span>
                  <div class="print-glyph">
                    {{
                      page === 'learn' && language === 'ru'
                        ? pair(active)
                            .map((g) => g.text)
                            .join(' ')
                        : active.text
                    }}
                  </div>
                </div>
                <div v-if="page === 'learn' && tracing" class="handwritten-example">
                  <span class="eyebrow">手写体</span>
                  <div class="reference-glyph">
                    <GlyphView
                      v-for="g in language === 'ru' ? pair(active) : [active]"
                      :key="g.id"
                      :glyph="g"
                    />
                  </div>
                </div>
              </div>
              <p v-if="page === 'test'">
                {{
                  question.type === 'write'
                    ? '观察印刷体，用手写体作答。'
                    : '从右侧四个手写字形中选择。'
                }}
              </p>
            </aside>
            <section class="work-panel">
              <template v-if="page === 'learn' || question.type === 'write'"
                ><div class="section-heading">
                  <h2>{{ page === 'learn' && tracing ? '沿着范字描摹' : '轮到你来写' }}</h2>
                  <PronunciationButton v-if="page === 'learn'" :key="active.id" :glyph="active" />
                  <span v-else>{{ busy ? '正在比对字形…' : '落笔 · 观察 · 再试一次' }}</span>
                </div>
                <div v-if="page === 'learn'" class="practice-toolbar">
                  <div class="segments" aria-label="练习模式">
                    <button
                      :class="{ active: tracing }"
                      :aria-pressed="tracing"
                      :disabled="busy"
                      @click="setPracticeMode(true)"
                    >
                      临摹
                    </button>
                    <button
                      :class="{ active: !tracing }"
                      :aria-pressed="!tracing"
                      :disabled="busy"
                      @click="setPracticeMode(false)"
                    >
                      测试
                    </button>
                  </div>
                  <div
                    v-if="variants(active).length > 1"
                    class="segments"
                    :aria-label="language === 'ja' ? '书写假名' : '书写大小写'"
                  >
                    <button
                      v-for="g in variants(active)"
                      :key="g.id"
                      :disabled="busy"
                      :class="{ active: active.id === g.id }"
                      :aria-pressed="active.id === g.id"
                      @click="switchCase(g)"
                    >
                      {{ variantLabel(g) }}
                    </button>
                  </div>
                </div>
                <WritingPad
                  ref="pad"
                  :key="`${active.id}-${stage}-${tracing}-${questionIndex}`"
                  :glyph="active"
                  :compact-tools="page === 'learn'"
                  :inline-actions="page === 'learn'"
                  :tracing="page === 'learn' && tracing"
                  :initial-strokes="currentInk"
                  :initial-drawing="currentDrawing"
                  :disabled="busy || !!detail || !!feedback"
                  :obscured="!!detail || !!reviewAnswer"
                  @submit="grade"
                  @ink="inkChanged"
              /></template>
              <div v-else class="choice-grid">
                <button
                  v-for="(option, i) in question.options"
                  :key="option.id"
                  @click="choose(option.id)"
                  :disabled="!!feedback"
                  :class="{
                    chosen: selected === option.id,
                    correct: !!feedback && option.id === active.id,
                    incorrect: !!feedback && selected === option.id && !feedback.correct,
                  }"
                  :aria-label="`选项 ${i + 1}`"
                >
                  <span>{{ 'ABCD'[i] }}</span
                  ><GlyphView :glyph="option" />
                </button>
              </div>
              <div v-if="feedback" class="feedback" :class="feedback.status" role="status">
                <div class="feedback-top">
                  <strong>{{
                    page === 'test' && question.type === 'choice'
                      ? feedback.correct
                        ? '回答正确'
                        : '再记一次'
                      : scoreLabel
                  }}</strong
                  ><span v-if="page === 'learn' || question.type === 'write'"
                    ><b>{{ feedback.score }}</b> / 100</span
                  >
                </div>
                <p>{{ feedback.feedback }}</p>
                <small v-if="page === 'learn' || question.type === 'write'"
                  >{{ tracing && page === 'learn' ? '描摹练习分' : '字形练习分' }} ·
                  本地相似度估计，不代表笔顺或书法等级。</small
                >
                <template v-if="lastInk && !(page === 'learn' && !tracing)"
                  ><button class="text-button" @click="overlay = !overlay">
                    {{ overlay ? '收起对照' : '叠加对照范字' }} ↗
                  </button>
                  <div v-if="overlay" class="comparison">
                    <img :src="template(active).toDataURL()" class="model-ink" alt="浅色范字" /><img
                      :src="lastInk"
                      alt="本次书写"
                    /><span>浅色：范字 · 深色：你的书写</span>
                  </div></template
                >
                <div
                  v-if="page === 'test' && question.type === 'choice' && !feedback.correct"
                  class="correct-answer"
                >
                  <span>正确范字</span><GlyphView :glyph="active" />
                </div>
                <div class="feedback-actions" v-if="page === 'learn'">
                  <button @click="retry" :disabled="busy">再写一次</button
                  ><button
                    v-if="stage === 'trace'"
                    class="primary"
                    @click="setPracticeMode(false)"
                    :disabled="busy"
                  >
                    独立书写 →
                  </button>
                </div>
                <div class="feedback-actions" v-else-if="feedback.status === 'uncertain'">
                  <button @click="retry">重新书写</button
                  ><button @click="advance(true)" :disabled="busy">跳过此题（记 0 分）</button>
                </div>
                <button v-else class="primary wide" @click="advance()" :disabled="busy">
                  {{ questionIndex === 9 ? '查看本轮结果' : '下一题 →' }}
                </button>
              </div>
              <button
                v-if="page === 'learn'"
                class="primary wide complete-study"
                :disabled="busy || !canAdvanceStudy"
                @click="completeStudy"
              >
                下一个
              </button>
              <p v-if="page === 'learn' && !canAdvanceStudy" class="fine-print">
                当前组各写法的测试均需达到 80 分，临摹分数不计入。
              </p>
            </section>
          </div>
        </template>
        <template v-else-if="page === 'summary'">
          <section class="summary-hero">
            <span class="eyebrow">ROUND COMPLETE</span>
            <h1>又熟悉了一点。</h1>
            <p>十次小小的练习，都是留下的进步。</p>
            <div class="summary-stats">
              <div>
                <b>{{ stats.writing }}</b
                ><span>书写平均分 / 100</span>
              </div>
              <div>
                <b
                  >{{ stats.choices }}<small> / {{ stats.choiceCount }}</small></b
                ><span>选择题答对</span>
              </div>
            </div>
            <div class="summary-actions">
              <button class="primary" @click="startRound(true)">
                {{ progress.drafts[language] ? '继续未完成测试 →' : '再练一轮 →' }}</button
              ><button @click="switchTab('study')">回到学习</button>
            </div>
          </section>
          <div class="section-heading">
            <h2>本轮回顾</h2>
            <span>点击查看作答与范字</span>
          </div>
          <div class="review-list">
            <button v-for="(answer, i) in answers" :key="i" @click="reviewAnswer = answer">
              <b>{{ answer.text }}</b
              ><span>{{ answer.type === 'write' ? '书写题' : '选择题' }}</span
              ><span>{{
                answer.status === 'skipped' ? '已跳过' : answer.correct ? '已匹配' : '待复习'
              }}</span
              ><strong>{{ answer.score }} 分</strong><span>↗</span>
            </button>
          </div>
        </template>
      </template>
      <footer>
        <span>Glyphora</span><span>WRITE SLOWLY. LEARN DEEPLY.</span>
        <details>
          <summary>字帖来源与评分说明</summary>
          <p>
            字形评分是离线模板相似度估计，尚未经过大规模真实手写样本校准。合理变体可能无法识别；不评判书法水平，不将字形相似度当作笔顺正确性。
          </p>
          <p>
            日语笔顺：KanjiVG / Ulrich Apel，CC BY-SA 3.0。俄语：Bad Script / The Bad Script Project
            Authors，SIL OFL。希腊语：Playpen Sans / The Playpen Sans Project Authors，SIL
            OFL。范字是一种参考写法。
          </p>
        </details>
        <PronunciationCredits :language="language" />
      </footer>
    </main>
    <nav class="bottom-tabs" aria-label="主导航" :inert="!!detail || !!reviewAnswer">
      <button
        v-for="item in [
          {
            id: 'study',
            name: '学习',
            icon: 'M4 5h6q2 0 2 2q0-2 2-2h6v14h-6q-2 0-2 2q0-2-2-2H4z M12 7v14',
          },
          { id: 'tests', name: '测试', icon: 'M8 4H5v17h14V4h-3 M8 3h8v4H8z M8 14l3 3 5-6' },
          { id: 'letters', name: '字母', icon: 'M4 20L11 4h2l7 16 M7 14h10' },
        ]"
        :key="item.id"
        :aria-current="tab === item.id ? 'page' : undefined"
        :class="{ active: tab === item.id }"
        :disabled="busy || loading"
        @click="switchTab(item.id as Tab)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="item.icon" /></svg
        ><span>{{ item.name }}</span>
      </button>
    </nav>
    <div
      v-if="detail || reviewAnswer"
      class="modal-backdrop"
      :class="{ 'writing-sheet-backdrop': detail && !reviewAnswer }"
      @click.self="
        detail = null;
        reviewAnswer = null;
      "
      @keydown.esc="
        detail = null;
        reviewAnswer = null;
      "
    >
      <section
        class="letter-dialog"
        :class="{ 'writing-sheet': detail && !reviewAnswer }"
        role="dialog"
        aria-modal="true"
        :aria-label="reviewAnswer ? '作答回顾' : '书写方法与动画'"
      >
        <span v-if="detail && !reviewAnswer" class="writing-sheet-handle" aria-hidden="true"></span>
        <button
          class="dialog-close"
          aria-label="关闭"
          @click="
            detail = null;
            reviewAnswer = null;
          "
        >
          ×
        </button>
        <template v-if="reviewAnswer"
          ><span class="eyebrow">ANSWER / 作答回顾</span>
          <h2>{{ reviewAnswer.text }} · {{ reviewAnswer.score }} 分</h2>
          <div class="order-example">
            <GlyphView :glyph="glyphs.find((g) => g.id === reviewAnswer!.id)!" />
          </div>
          <p>正确的手写范字</p>
          <template v-if="reviewAnswer.type === 'write'"
            ><img
              v-if="reviewAnswer.strokes.length"
              class="answer-ink"
              :src="raster(reviewAnswer.strokes).toDataURL()"
              alt="当时的书写"
            />
            <p v-else>本题未书写。</p></template
          >
          <p v-else>
            你的选择：{{
              glyphs.find((g) => reviewAnswer!.type === 'choice' && g.id === reviewAnswer!.chosenID)?.text ?? '未作答'
            }}
          </p>
          <p>{{ reviewAnswer.correct ? '已匹配' : '建议再练习这个字母' }}</p>
          <button
            class="primary wide"
            @click="
              learn(glyphs.find((g) => g.id === reviewAnswer!.id)!);
              reviewAnswer = null;
            "
          >
            练习这个字母 →
          </button></template
        >
        <template v-else-if="detail">
          <div class="writing-sheet-toolbar">
            <div
              v-if="detailCases.length > 1"
              class="segments"
              :aria-label="detail.language === 'ja' ? '书写说明假名' : '书写说明大小写'"
            >
              <button
                v-for="g in detailCases"
                :key="g.id"
                :class="{ active: detail.id === g.id }"
                :aria-pressed="detail.id === g.id"
                @click="detail = g"
              >
                {{ variantLabel(g) }} {{ g.text }}
              </button>
            </div>
            <PronunciationButton :key="detail.id" :glyph="detail" />
          </div>
          <StrokeOrder :key="detail.id" :glyph="detail" :autoplay="page === 'learn'" /><button
            v-if="page !== 'learn'"
            class="primary wide"
            @click="learn(detail)"
          >
            练习这个字母 →
          </button></template
        >
      </section>
    </div>
  </div>
</template>
