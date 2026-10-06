<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t, locale } = useAppI18n();
import { tts, formatLLMStatus, type LLMStatus } from '@lingrove/host-sdk';
import { computed, nextTick, onMounted, onUnmounted, ref, shallowReactive, watch } from 'vue';
import { createID, isNative, ready, setRootPage, installFocusMode } from '@lingrove/host-sdk';
import { importArticle, readTextFile, splitArticle, type ImportDetail } from './import';
import { analyzeSentence, type SentenceAnalysis } from './sentence-analysis';
import { demo, demoSource } from './demo';
import VoiceField from './components/VoiceField.vue';
import { useNarration } from './narration';
import { paragraphSpacing, readingLayout, splitReadingSentences } from './reading-layout';
import {
  MAX_ARTICLE_LENGTH,
  languages,
  languageName,
  parseTags,
  type Language,
  type SavedReading,
} from './model';
import { freshState, loadState, saveState, type AnalysisJob } from './storage';
const state = ref(freshState());
const initialized = ref(false);
const page = ref<'library' | 'data' | 'reader'>('library');
const active = ref<SavedReading | null>(null);
const result = computed(() =>
  active.value
    ? {
        ...active.value.reading,
        sentences: splitReadingSentences(active.value.reading.sentences),
      }
    : undefined,
);
function cachedAnalysis(text: string) {
  return Object.values(active.value?.analyses ?? {}).find(
    (analysis) =>
      analysis.analysis_text === text &&
      analysis.language === locale.value &&
      analysis.sourceLanguage === active.value?.reading.language,
  );
}
const displayedSentences = computed(() => result.value?.sentences.map(readingLayout) ?? []);
const narration = useNarration(
  () =>
    displayedSentences.value.map(
      (sentence) => sentence.tokens.map((token) => token.text).join('') + sentence.trailing,
    ),
  () => result.value?.language,
  tts,
  () => active.value?.speechVoice,
);
const {
  position: speechPosition,
  state: speechState,
  error: speechError,
  speakingSentence,
} = narration;
const followSpeech = ref(true);
function scrollToSpeakingSentence() {
  const index = speakingSentence.value ?? narration.requestedSentence.value;
  if (
    !followSpeech.value ||
    index === null ||
    page.value !== 'reader' ||
    document.querySelector('dialog[open]')
  )
    return;
  document.getElementById(`sentence-${index}`)?.scrollIntoView?.({ block: 'start' });
}
function restoreSpeechFollow() {
  followSpeech.value = true;
  scrollToSpeakingSentence();
}
function handleManualScroll(event: Event) {
  if (
    !speechActive.value ||
    page.value !== 'reader' ||
    event.defaultPrevented ||
    document.querySelector('dialog[open]')
  )
    return;
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest('input, textarea, select, button, .speech-float, dialog')
  )
    return;
  if (
    event instanceof KeyboardEvent &&
    !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)
  )
    return;
  followSpeech.value = false;
}
watch(speakingSentence, scrollToSpeakingSentence, { flush: 'post' });
const voiceSheet = ref<HTMLDialogElement>();
const voiceOptions = ref<{ id: string; title: string; language: string }[]>([]);
const voiceLoading = ref(false);
const voiceError = ref('');
async function loadVoices() {
  voiceLoading.value = true;
  voiceError.value = '';
  try {
    voiceOptions.value = (await tts.status()).voices;
  } catch {
    voiceError.value = '无法加载音色，请重试。';
  } finally {
    voiceLoading.value = false;
  }
}
function openVoiceSettings() {
  voiceSheet.value?.showModal();
  void loadVoices();
}
function changeArticleVoice(value: string) {
  if (!active.value) return;
  active.value.speechVoice = value || undefined;
  void persist();
  if (speechActive.value) void narration.seek(speechPosition.value);
}
const seekPreview = ref<number | null>(null);
const showSpeechLoading = ref(false);
watch(speechState, (value, _previous, onCleanup) => {
  showSpeechLoading.value = false;
  if (value !== 'buffering') return;
  const timer = setTimeout(() => {
    showSpeechLoading.value = true;
  }, 600);
  onCleanup(() => clearTimeout(timer));
});
const speechActive = computed(() => ['playing', 'buffering', 'paused'].includes(speechState.value));
const showPlaybackHint = ref(false);
watch(speechActive, (active, _previous, onCleanup) => {
  showPlaybackHint.value = false;
  if (!active || state.value.playbackHintSeen) return;
  state.value.playbackHintSeen = true;
  showPlaybackHint.value = true;
  void persist();
  const timer = setTimeout(() => {
    showPlaybackHint.value = false;
  }, 5000);
  onCleanup(() => clearTimeout(timer));
});
function toggleSpeech() {
  seekPreview.value = null;
  if (speechActive.value) narration.stop();
  else {
    followSpeech.value = true;
    void narration.seek(speechPosition.value >= 100 ? 0 : speechPosition.value);
  }
}
function commitSpeechSeek(event: Event) {
  followSpeech.value = true;
  const value = Number((event.target as HTMLInputElement).value);
  seekPreview.value = null;
  void narration.seek(value);
}
watch(
  () => active.value?.id,
  () => {
    narration.stop();
    followSpeech.value = true;
    speechPosition.value = 0;
    speechError.value = '';
  },
);
const readerToolbarHidden = ref(false);
let lastReaderScroll = 0;
let readerScrollDelta = 0;
function resetReaderToolbar() {
  readerToolbarHidden.value = false;
  lastReaderScroll = Math.max(0, window.scrollY);
  readerScrollDelta = 0;
}
function handleReaderScroll() {
  if (page.value !== 'reader' || sheet.value?.open) return;
  const y = Math.max(
    0,
    Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight),
  );
  const delta = y - lastReaderScroll;
  lastReaderScroll = y;
  if (y <= 12) {
    resetReaderToolbar();
    return;
  }
  if (delta === 0) return;
  readerScrollDelta =
    Math.sign(delta) === Math.sign(readerScrollDelta) ? readerScrollDelta + delta : delta;
  if (Math.abs(readerScrollDelta) >= 12) {
    readerToolbarHidden.value = readerScrollDelta > 0;
    readerScrollDelta = 0;
  }
}
const selectedSentence = ref<number | null>(null);
const sentenceResult = ref<SentenceAnalysis | null>(null);
const sentenceBusy = ref(false);
const sentenceStatus = ref<LLMStatus>();
const sentenceError = ref('');
type SentenceTask = { controller: AbortController; status?: LLMStatus };
const sentenceTasks = shallowReactive(new Map<string, SentenceTask>());
function isSentenceAnalyzing(text: string) {
  return !!active.value && sentenceTasks.has(sentenceTaskKey(active.value.id, text));
}
function sentenceTaskKey(articleID: string, text: string) {
  return JSON.stringify([articleID, text, locale.value, active.value?.reading.language]);
}
const sentenceText = computed(() =>
  selectedSentence.value === null
    ? ''
    : (result.value?.sentences[selectedSentence.value]?.tokens.map((t) => t.text).join('') ?? ''),
);
const sheet = ref<HTMLDialogElement>();
const importer = ref<HTMLDialogElement>();
const deleteSheet = ref<HTMLDialogElement>();
const deleteTarget = ref<{ id: string; title: string } | null>(null);
function requestDelete(item: { id: string; title?: string; source: string }) {
  deleteTarget.value = { id: item.id, title: item.title || item.source.slice(0, 36) };
  deleteSheet.value?.showModal();
}
function confirmDelete() {
  const id = deleteTarget.value?.id;
  if (!id) return;
  if (runningJob?.id === id) controller?.abort();
  state.value.jobs = state.value.jobs.filter((job) => job.id !== id);
  state.value.library = state.value.library.filter((item) => item.id !== id);
  if (selectedJob.value?.id === id) jobSheet.value?.close();
  deleteSheet.value?.close();
  deleteTarget.value = null;
  void persist();
}
const fileInput = ref<HTMLInputElement>();
const menu = ref(false);
const submitting = ref(false);
const jobSheet = ref<HTMLDialogElement>();
const selectedJob = ref<AnalysisJob | null>(null);
const details = ref<
  Record<string, ImportDetail & { startedAt: number; updatedAt: number; endedAt?: number }>
>({});
const now = ref(Date.now());
let progressTimer: ReturnType<typeof setInterval> | undefined;
const currentDetail = computed(() =>
  selectedJob.value ? details.value[selectedJob.value.id] : undefined,
);
const stageName = computed(
  () =>
    ({
      waiting: '等待模型响应',
      receiving: '接收假名注音数据',
      validating: '校验原文与注音对应关系',
      retrying: '当前段响应异常，即将自动重试',
      repairing: '正在补全模型遗漏句子的假名注音',
      complete: '全部预处理完成',
    })[currentDetail.value?.stage ?? 'waiting'],
);
const fileBusy = ref(false);
const error = ref('');
const storageError = ref('');
const importTitle = computed({
  get: () => state.value.draftTitle,
  set: (value) => {
    state.value.draftTitle = value;
  },
});
const origin = computed({
  get: () => state.value.draftOrigin,
  set: (value) => {
    state.value.draftOrigin = value;
  },
});
const composing = ref(false);
let removeFocusMode: (() => void) | undefined;
let controller: AbortController | undefined;
let runningJob: AnalysisJob | undefined;
let disposed = false;
let draftTimer: ReturnType<typeof setTimeout> | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
let observer: IntersectionObserver | undefined;
let lastTick = Date.now();
let wasVisible = !document.hidden;
const currentSentence = computed(() => active.value?.sentence ?? 0);
const editSheet = ref<HTMLDialogElement>();
const editingArticle = ref<SavedReading | null>(null);
const editDraft = ref({
  title: '',
  source: '',
  origin: '',
  language: 'ja' as Language,
  tags: '',
  voice: '',
});
const editBusy = ref(false);
const editError = ref('');
let editController: AbortController | undefined;
function openArticleEditor(item: SavedReading) {
  editingArticle.value = item;
  editDraft.value = {
    title: item.title ?? '',
    source: item.source,
    origin: item.origin ?? '',
    language: item.reading.language,
    tags: (item.tags ?? []).join('，'),
    voice: item.speechVoice ?? '',
  };
  editError.value = '';
  editSheet.value?.showModal();
  void loadVoices();
}
function closeArticleEditor() {
  editController?.abort();
  editController = undefined;
  editBusy.value = false;
  editSheet.value?.close();
}
function updateEditLanguage() {
  // A voice selected for the previous language must not override the new language.
  editDraft.value.voice = '';
}
async function saveArticleEdit() {
  const item = editingArticle.value;
  if (!item || editBusy.value) return;
  const draft = { ...editDraft.value };
  const request = new AbortController();
  editController = request;
  editBusy.value = true;
  editError.value = '';
  try {
    splitArticle(draft.source);
    const contentChanged = item.source !== draft.source;
    const languageChanged = item.reading.language !== draft.language;
    const reading =
      contentChanged || (languageChanged && draft.language === 'ja')
        ? await importArticle(
            draft.source,
            request.signal,
            () => {},
            undefined,
            [],
            undefined,
            draft.language,
          )
        : { ...item.reading, language: draft.language };
    if (request.signal.aborted || disposed || !state.value.library.includes(item)) return;
    if (contentChanged || languageChanged) {
      for (const [key, task] of sentenceTasks) {
        if (JSON.parse(key)[0] === item.id) {
          task.controller.abort();
          sentenceTasks.delete(key);
        }
      }
      if (active.value?.id === item.id) narration.stop();
    }
    Object.assign(item, {
      title: draft.title.trim() || draft.source.trim().slice(0, 36),
      source: draft.source,
      origin: draft.origin.trim(),
      reading,
      tags: parseTags(draft.tags),
      speechVoice: draft.voice || undefined,
    });
    if (contentChanged) item.sentence = 0;
    await persist();
    if (!storageError.value) editSheet.value?.close();
    else editError.value = '保存失败，请重试。';
  } catch (e) {
    if (!request.signal.aborted) editError.value = e instanceof Error ? e.message : String(e);
  } finally {
    if (editController === request) {
      editBusy.value = false;
      editController = undefined;
    }
  }
}
function stats(item: SavedReading) {
  return (item.stats ??= { opens: 0, seconds: 0, lookups: 0, visited: [], lastRead: 0 });
}
const totals = computed(() =>
  state.value.library.reduce(
    (total, item) => {
      const s = item.stats;
      total.chars += item.source.length;
      total.sentences += splitReadingSentences(item.reading.sentences).length;
      total.words += item.reading.sentences.reduce(
        (n, sentence) => n + sentence.tokens.filter((t) => t.kind === 'word').length,
        0,
      );
      total.seconds += s?.seconds ?? 0;
      total.lookups += s?.lookups ?? 0;
      total.opens += s?.opens ?? 0;
      total.visited += s?.visited.length ?? 0;
      return total;
    },
    { chars: 0, sentences: 0, words: 0, seconds: 0, lookups: 0, opens: 0, visited: 0 },
  ),
);
async function persist() {
  if (!initialized.value) return;
  try {
    await saveState(state.value);
    storageError.value = '';
  } catch {
    storageError.value = '本地保存失败，请重试；空间不足时可在「我的」中删除不需要的文章。';
  }
}
watch(
  () => [state.value.draft, state.value.draftTitle, state.value.draftOrigin, state.value.draftTags],
  () => {
    if (!initialized.value) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => void persist(), 350);
  },
);
watch(page, (value) => {
  if (value !== 'reader') narration.stop();
  void setRootPage(value !== 'reader').catch(() => {});
  window.scrollTo?.(0, 0);
  resetReaderToolbar();
});
onMounted(async () => {
  removeFocusMode = installFocusMode();
  window.addEventListener('scroll', handleReaderScroll, { passive: true });
  window.addEventListener('touchmove', handleManualScroll, { passive: true });
  window.addEventListener('wheel', handleManualScroll, { passive: true });
  window.addEventListener('keydown', handleManualScroll);
  try {
    await ready();
    await setRootPage(true);
  } catch {
    error.value = '打开失败，请重新打开应用。';
  }
  try {
    state.value = await loadState();
  } catch {
    storageError.value = '本地记录无法读取，本次未恢复。';
  }
  initialized.value = true;
  progressTimer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  timer = setInterval(() => {
    tick();
    if (page.value === 'reader') void persist();
  }, 15000);
  document.addEventListener('visibilitychange', visibility);
});
onUnmounted(() => {
  narration.stop();
  removeFocusMode?.();
  window.removeEventListener('scroll', handleReaderScroll);
  window.removeEventListener('touchmove', handleManualScroll);
  window.removeEventListener('wheel', handleManualScroll);
  window.removeEventListener('keydown', handleManualScroll);
  stopSentenceRequest();
  tick();
  disposed = true;
  clearSentencePress();
  analysisPause = undefined;
  editController?.abort();
  controller?.abort();
  for (const job of state.value.jobs)
    if (job.status === 'running' || job.status === 'queued') {
      job.status = 'paused';
      job.error = '分析已中断，可继续未完成的段落。';
    }
  clearTimeout(draftTimer);
  void persist();
  clearInterval(timer);
  clearInterval(progressTimer);
  observer?.disconnect();
  document.removeEventListener('visibilitychange', visibility);
});
function tick() {
  const now = Date.now();
  if (page.value === 'reader' && active.value && wasVisible)
    stats(active.value).seconds += Math.min(15, Math.max(0, (now - lastTick) / 1000));
  lastTick = now;
  wasVisible = !document.hidden;
}
function visibility() {
  tick();
  void persist();
}
function navigate(destination: 'library' | 'data') {
  tick();
  observer?.disconnect();
  page.value = destination;
  menu.value = false;
  void persist();
}
async function openReading(item: SavedReading) {
  active.value = item;
  page.value = 'reader';
  stats(item).opens++;
  stats(item).lastRead = Date.now();
  lastTick = Date.now();
  await nextTick();
  document.getElementById(`sentence-${item.sentence}`)?.scrollIntoView?.({ block: 'center' });
  resetReaderToolbar();
  if (typeof IntersectionObserver !== 'undefined') {
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        if (document.hidden || page.value !== 'reader') return;
        for (const entry of entries)
          if (entry.isIntersecting)
            markSentence(Number((entry.target as HTMLElement).dataset.sentence));
      },
      { threshold: 0.5 },
    );
    document.querySelectorAll('[data-sentence]').forEach((el) => observer!.observe(el));
  }
  void persist();
}
function markSentence(index: number) {
  if (!active.value) return;
  active.value.sentence = index;
  if (!stats(active.value).visited.includes(index)) stats(active.value).visited.push(index);
  void persist();
}
const sentencePointerStartedOutside = ref(false);
function isOutsideSentenceSheet(event: MouseEvent) {
  const dialog = sheet.value;
  if (!dialog || event.target !== dialog) return false;
  const bounds = dialog.getBoundingClientRect();
  return (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  );
}
function closeSentenceFromBackdrop(event: MouseEvent) {
  const shouldClose = sentencePointerStartedOutside.value && isOutsideSentenceSheet(event);
  sentencePointerStartedOutside.value = false;
  if (shouldClose) sheet.value?.close();
}
function stopSentenceRequest() {
  for (const task of sentenceTasks.values()) task.controller.abort();
  sentenceTasks.clear();
  sentenceBusy.value = false;
}
let sentencePress:
  | { id: number; index: number; x: number; y: number; timer: ReturnType<typeof setTimeout> }
  | undefined;
let suppressSentenceClick: number | null = null;
let analysisPause: { articleID: string; ready: Promise<void> } | undefined;
function clearSentencePress() {
  if (sentencePress) clearTimeout(sentencePress.timer);
  sentencePress = undefined;
}
function beginSentencePress(event: PointerEvent, index: number) {
  clearSentencePress();
  suppressSentenceClick = null;
  if (!speechActive.value || event.button !== 0 || event.isPrimary === false) return;
  sentencePress = {
    id: event.pointerId,
    index,
    x: event.clientX,
    y: event.clientY,
    timer: setTimeout(() => {
      clearSentencePress();
      suppressSentenceClick = index;
      void inspectDuringPlayback(index);
    }, 500),
  };
}
function moveSentencePress(event: PointerEvent) {
  if (!sentencePress || event.pointerId !== sentencePress.id) return;
  if (Math.hypot(event.clientX - sentencePress.x, event.clientY - sentencePress.y) > 10) {
    suppressSentenceClick = sentencePress.index;
    clearSentencePress();
  }
}
function cancelSentencePress() {
  if (sentencePress) suppressSentenceClick = sentencePress.index;
  clearSentencePress();
}
function activateSentence(index: number) {
  if (suppressSentenceClick === index) {
    suppressSentenceClick = null;
    return;
  }
  if (!speechActive.value) {
    void inspectSentence(index);
    return;
  }
  if (index === narration.requestedSentence.value) return;
  seekPreview.value = null;
  followSpeech.value = true;
  void narration.seekSentence(index);
}
async function inspectDuringPlayback(index: number) {
  if (speechActive.value && speechState.value !== 'paused' && active.value) {
    analysisPause = { articleID: active.value.id, ready: narration.pause() };
  }
  await inspectSentence(index);
}
async function resumeAfterAnalysis() {
  const pending = analysisPause;
  analysisPause = undefined;
  if (!pending) return;
  await pending.ready;
  if (
    !disposed &&
    page.value === 'reader' &&
    active.value?.id === pending.articleID &&
    !sheet.value?.open &&
    speechState.value === 'paused'
  ) {
    await narration.resume();
    scrollToSpeakingSentence();
  }
}
function sentenceContextMenu(event: MouseEvent, index: number) {
  if (!speechActive.value) return;
  event.preventDefault();
  clearSentencePress();
  suppressSentenceClick = index;
  if (!sheet.value?.open) void inspectDuringPlayback(index);
}
function sentenceKey(event: KeyboardEvent, index: number) {
  suppressSentenceClick = null;
  if (event.shiftKey) void inspectDuringPlayback(index);
  else activateSentence(index);
}
async function inspectSentence(index: number) {
  if (!active.value) return;
  selectedSentence.value = index;
  sentenceResult.value = cachedAnalysis(sentenceText.value) ?? null;
  sentenceError.value = '';
  const task = sentenceTasks.get(sentenceTaskKey(active.value.id, sentenceText.value));
  sentenceBusy.value = !!task;
  sentenceStatus.value = task?.status;
  markSentence(index);
  stats(active.value).lookups++;
  void persist();
  if (!sheet.value?.open) sheet.value?.showModal();
}
watch(locale, () => {
  stopSentenceRequest();
  sentenceResult.value = null;
  sentenceError.value = '';
});
async function startSentenceAnalysis() {
  if (
    !active.value ||
    selectedSentence.value === null ||
    sentenceBusy.value ||
    sentenceResult.value ||
    !sheet.value?.open
  )
    return;
  const article = active.value;
  const index = selectedSentence.value;
  const textAt = (i: number) =>
    result.value?.sentences[i]?.tokens.map((t) => t.text).join('') ?? '';
  const text = textAt(index);
  const key = sentenceTaskKey(article.id, text);
  if (sentenceTasks.has(key)) return;
  const task: SentenceTask = { controller: new AbortController() };
  sentenceTasks.set(key, task);
  const isSelected = () => active.value?.id === article.id && sentenceText.value === text;
  sentenceError.value = '';
  sentenceBusy.value = true;
  sentenceStatus.value = undefined;
  try {
    const analysis = await analyzeSentence(
      text,
      {
        before: textAt(index - 1),
        after: textAt(index + 1),
        sourceLanguage: article.reading.language,
      },
      task.controller.signal,
      (status) => {
        if (task.controller.signal.aborted || disposed) return;
        task.status = status;
        if (isSelected()) sentenceStatus.value = status;
      },
    );
    if (
      task.controller.signal.aborted ||
      disposed ||
      !state.value.library.some((item) => item.id === article.id)
    )
      return;
    analysis.sourceLanguage = article.reading.language;
    (article.analyses ??= {})[
      JSON.stringify([analysis.analysis_text, analysis.sourceLanguage, analysis.language])
    ] = analysis;
    if (isSelected()) sentenceResult.value = analysis;
    await persist();
  } catch (e) {
    if (isSelected() && !task.controller.signal.aborted && !disposed)
      sentenceError.value = e instanceof Error ? e.message : '句子分析失败，请重试。';
  } finally {
    if (sentenceTasks.get(key) === task) {
      sentenceTasks.delete(key);
      if (isSelected()) sentenceBusy.value = false;
    }
  }
}
function beginImport() {
  menu.value = false;
  error.value = '';

  importer.value?.showModal();
}
async function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  fileBusy.value = true;
  error.value = '';
  menu.value = false;
  try {
    const text = await readTextFile(file);
    state.value.draft = text;
    origin.value = file.name;
    importTitle.value = file.name.replace(/\.(txt|md)$/i, '');
    importer.value?.showModal();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    fileBusy.value = false;
  }
}
function closeImport() {
  importer.value?.close();
  clearTimeout(draftTimer);
  void persist();
}
async function start() {
  if (submitting.value || composing.value || !initialized.value) return;
  error.value = '';
  let total: number;
  try {
    total = splitArticle(state.value.draft).length;
  } catch (e) {
    error.value = (e as Error).message;
    return;
  }
  submitting.value = true;
  const job: AnalysisJob = {
    id: createID(),
    source: state.value.draft,
    language: state.value.draftLanguage,
    tags: parseTags(state.value.draftTags),
    title: importTitle.value.trim() || state.value.draft.trim().slice(0, 36),
    origin: origin.value,
    createdAt: Date.now(),
    status: 'queued',
    done: 0,
    total,
    error: '',
  };
  state.value.jobs.unshift(job);
  state.value.draft = '';
  state.value.draftTags = '';
  importTitle.value = '';
  origin.value = '文本导入';
  await persist();
  importer.value?.close();
  page.value = 'library';
  submitting.value = false;
  void pump();
}
async function pump() {
  if (controller || disposed) return;
  const job = [...state.value.jobs].reverse().find((j) => j.status === 'queued');
  if (!job) return;
  const request = new AbortController();
  controller = request;
  runningJob = job;
  const startedAt = Date.now();
  details.value[job.id] = {
    startedAt,
    updatedAt: startedAt,
    stage: 'waiting',
    attempt: 1,
    current: 1,
    start: 1,
    end: 0,
    preview: '',
    received: 0,
    sentences: 0,
    words: 0,
  };
  job.status = 'running';
  job.done = 0;
  job.error = '';
  void persist();
  try {
    const reading = await importArticle(
      job.source,
      request.signal,
      (done, total) => {
        if (request.signal.aborted || disposed) return;
        job.done = done;
        job.total = total;
        void persist();
      },
      (detail) => {
        if (!request.signal.aborted && !disposed) {
          const previous = details.value[job.id];
          const changed =
            !previous ||
            previous.received !== detail.received ||
            previous.stage !== detail.stage ||
            previous.requestStatus?.outputTokens !== detail.requestStatus?.outputTokens;
          details.value[job.id] = {
            ...detail,
            startedAt,
            updatedAt: changed ? Date.now() : previous.updatedAt,
          };
        }
      },
      job.parts,
      async (parts) => {
        if (request.signal.aborted || disposed) return;
        job.parts = parts;
        await persist();
      },
      job.language,
    );
    if (request.signal.aborted || disposed || !state.value.jobs.some((j) => j.id === job.id))
      return;
    state.value.library.unshift({
      id: job.id,
      source: job.source,
      title: job.title,
      origin: job.origin,
      tags: job.tags,
      createdAt: job.createdAt,
      reading,
      sentence: 0,
    });
    job.status = 'ready';
    job.done = job.total;
    state.value.jobs = state.value.jobs.filter((j) => j.id !== job.id);
  } catch (e) {
    if (!request.signal.aborted && !disposed) {
      job.status = 'failed';
      job.error = e instanceof Error ? e.message : '分析失败，请重试。';
    }
  } finally {
    if (details.value[job.id]) details.value[job.id].endedAt = Date.now();
    if (controller === request) {
      controller = undefined;
      runningJob = undefined;
    }
    if (!disposed) {
      await persist();
      void pump();
    }
  }
}
function openJob(job: AnalysisJob) {
  selectedJob.value = job;
  jobSheet.value?.showModal();
}
function pauseJob(job: AnalysisJob) {
  if (details.value[job.id]) details.value[job.id].endedAt = Date.now();
  job.status = 'paused';
  job.error = '分析已暂停，继续时将跳过已完成的段落。';
  if (runningJob?.id === job.id) controller?.abort();
  void persist();
}
function retryJob(job: AnalysisJob) {
  job.status = 'queued';
  job.error = '';
  job.done = 0;
  void persist();
  void pump();
}
function readCompletedJob(job: AnalysisJob) {
  const item = state.value.library.find((i) => i.id === job.id);
  if (item) {
    jobSheet.value?.close();
    void openReading(item);
  }
}
function jobLabel(job: AnalysisJob) {
  return job.status === 'running'
    ? `分析中 · ${job.done}/${job.total} 段`
    : job.status === 'queued'
      ? '等待分析'
      : job.status === 'failed'
        ? '分析失败 · 点击重试'
        : job.status === 'ready'
          ? '分析完成'
          : '分析已暂停';
}
function showExample() {
  void openReading({
    id: 'demo',
    title: '图书馆的一天',
    source: demoSource,
    createdAt: 0,
    reading: demo,
    sentence: 0,
  });
}
function date(value: number) {
  return value
    ? new Date(value).toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
    : '尚未阅读';
}
function duration(seconds: number) {
  return seconds < 60 ? `${Math.floor(seconds)} 秒` : `${Math.floor(seconds / 60)} 分钟`;
}
</script>
<template>
  <main :class="{ native: isNative(), 'reader-page': page === 'reader' }">
    <template v-if="page !== 'reader'">
      <div class="home-actions lingrove-root-actions">
        <div v-if="page === 'library'" class="import-control">
          <button
            class="icon-button"
            :aria-label="t('导入文章')"
            :aria-expanded="menu"
            :disabled="!initialized || submitting || fileBusy"
            @click="menu = !menu"
            @keydown.esc="menu = false"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M13 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8M13 3l5 5h-5V3M8 12h4m-4 4h3m7-3v8m-4-4h8"
              />
            </svg>
          </button>
          <template v-if="menu"
            ><button
              class="menu-dismiss"
              :aria-label="t('关闭导入菜单')"
              @click="menu = false"
            ></button>
            <div class="import-menu">
              <button @click="beginImport">{{ t('导入文本') }}</button
              ><button
                @click="
                  menu = false;
                  fileInput?.click();
                "
              >
                {{ t('导入文件') }} <small>TXT / Markdown</small>
              </button>
            </div></template
          >
        </div>
      </div>
      <section v-if="page === 'library'" class="library">
        <div v-if="!state.library.length && !state.jobs.length" class="empty">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5c-4-3-8-1-9 0v15c3-2 6-2 9 0 3-2 6-2 9 0V5c-3-2-6-2-9 0Zm0 0v15" />
          </svg>
          <h1>{{ t('还没有文章') }}</h1>
          <p>{{ t('从右上角导入一篇文本，') }}<br />{{ t('解析完成后，就可以开始阅读。') }}</p>
          <button v-if="!isNative()" class="text-button" @click="showExample">
            {{ t('体验示例阅读 →') }}
          </button>
        </div>
        <article v-for="job in state.jobs" :key="job.id" class="article-card pending-card">
          <button class="article-open" @click="openJob(job)">
            <small>{{ t(languageName(job.language)) }} · {{ t(date(job.createdAt)) }}</small>
            <h2>{{ job.title }}</h2>
            <p :lang="job.language" dir="auto">{{ job.source.slice(0, 100) }}</p>
            <div class="article-meta">
              <span>{{ job.source.length }} {{ t('字') }}</span
              ><span role="status">{{ t(jobLabel(job)) }} →</span>
            </div>
          </button>
        </article>
        <article v-for="item in state.library" :key="item.id" class="article-card">
          <button class="article-open" @click="openReading(item)">
            <small
              >{{ t(languageName(item.reading.language)) }} · {{ t(date(item.createdAt)) }}</small
            >
            <h2>{{ item.title || item.source.trim().slice(0, 36) }}</h2>
            <p :lang="item.reading.language" dir="auto">{{ item.source.slice(0, 100) }}</p>
            <div class="article-meta">
              <span
                >{{ item.source.length.toLocaleString() }} {{ t('字 ·') }}
                {{ splitReadingSentences(item.reading.sentences).length }} {{ t('句') }}</span
              ><span>{{ t(item.stats?.opens ? `读到第 ${item.sentence + 1} 句` : '未读') }} →</span>
            </div>
          </button>
        </article>
      </section>
      <section v-else class="data-page">
        <h1>{{ t('我的') }}</h1>
        <h2>{{ t('导入的文章') }}</h2>
        <div class="metrics">
          <div>
            <strong>{{ t(state.library.length + state.jobs.length) }}</strong
            ><span>{{ t('篇文章') }}</span>
          </div>
          <div>
            <strong>{{
              (totals.chars + state.jobs.reduce((n, j) => n + j.source.length, 0)).toLocaleString()
            }}</strong
            ><span>{{ t('原文字符') }}</span>
          </div>
          <div>
            <strong>{{ t(totals.words.toLocaleString()) }}</strong
            ><span>{{ t('已分词语') }}</span>
          </div>
        </div>
        <h2>{{ t('阅读记录') }}</h2>
        <div class="metrics">
          <div>
            <strong>{{ t(duration(totals.seconds)) }}</strong
            ><span>{{ t('阅读时长') }}</span>
          </div>
          <div>
            <strong>{{ t(totals.visited) }} / {{ t(totals.sentences) }}</strong
            ><span>{{ t('浏览过的句子') }}</span>
          </div>
          <div>
            <strong>{{ t(totals.lookups) }}</strong
            ><span>{{ t('查看解析次数') }}</span>
          </div>
        </div>
        <p class="hint">
          {{ t('累计打开') }} {{ t(totals.opens) }}
          {{ t('次。时长仅统计阅读页在前台的时间；浏览句子不等于掌握。') }}
        </p>
        <h2>{{ t('文章明细') }}</h2>
        <p v-if="state.jobs.length" class="hint">
          {{ t(state.jobs.length) }} {{ t('篇待完成分析') }}
        </p>
        <article v-for="job in state.jobs" :key="job.id" class="data-article">
          <button @click="openJob(job)">
            <strong>{{ job.title }}</strong
            ><span>{{ t(jobLabel(job)) }}</span></button
          ><button class="delete" @click="requestDelete(job)">{{ t('删除') }}</button>
        </article>
        <p v-if="!state.library.length && !state.jobs.length" class="hint">
          {{ t('导入文章后，这里会显示文章与阅读数据。') }}
        </p>
        <article v-for="item in state.library" :key="item.id" class="data-article">
          <button @click="openArticleEditor(item)">
            <strong>{{ item.title || item.source.slice(0, 36) }}</strong
            ><span
              >{{ t(item.origin || '文本导入') }} · {{ item.source.length }} {{ t('字 ·') }}
              {{ splitReadingSentences(item.reading.sentences).length }} {{ t('句') }}</span
            ><span
              >{{ t('阅读') }} {{ t(duration(item.stats?.seconds ?? 0)) }} {{ t('· 查看解析') }}
              {{ t(item.stats?.lookups ?? 0) }} {{ t('次') }}</span
            ><span>{{ t('最近阅读：') }}{{ t(date(item.stats?.lastRead ?? 0)) }}</span></button
          ><span v-if="item.tags?.length" class="article-tags"
            ><span v-for="tag in item.tags" :key="tag">{{ tag }}</span></span
          ><button
            class="delete"
            :aria-label="t(`删除文章：${item.title || item.source.slice(0, 20)}`)"
            @click="requestDelete(item)"
          >
            {{ t('删除') }}
          </button>
        </article>
      </section>
    </template>
    <template v-else-if="result && active">
      <div
        class="reader-nav lingrove-secondary-toolbar"
        :class="{ 'is-hidden': readerToolbarHidden }"
        @focusin="resetReaderToolbar"
      >
        <button class="text-button" @click="navigate('library')">{{ t('← 返回文章') }}</button
        ><label v-if="active.reading.language === 'ja'"
          ><input v-model="state.ruby" type="checkbox" @change="persist" />{{
            t('假名注音')
          }}</label
        >
      </div>
      <section class="speech-float" :aria-label="t('文章朗读')">
        <button
          v-if="speechActive && !followSpeech"
          class="speech-return"
          @click="restoreSpeechFollow"
        >
          {{ t('回到当前句') }}
        </button>
        <p v-if="showPlaybackHint" class="playback-hint" role="status">
          {{ t('点句子跳播，长按看解析') }}
        </p>
        <p v-if="speechError" class="speech-error" role="alert">{{ t(speechError) }}</p>
        <div class="speech-float-row">
          <button
            class="speech-toggle"
            :aria-label="t(speechActive ? '停止朗读' : '开始朗读')"
            :title="t(speechActive ? '停止朗读' : '开始朗读')"
            :aria-expanded="speechActive"
            @click="toggleSpeech"
          >
            <svg
              v-if="showSpeechLoading"
              class="speech-spinner"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="8" />
            </svg>
            <svg v-else-if="speechActive" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 19 12 8 19Z" /></svg>
          </button>
          <div v-if="speechActive" class="speech-progress">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              :value="seekPreview ?? speechPosition"
              :aria-label="t('朗读位置')"
              :title="t('按文本比例定位，松手后从目标句子开始朗读。')"
              @input="seekPreview = Number(($event.target as HTMLInputElement).value)"
              @change="commitSpeechSeek"
              @pointercancel="seekPreview = null"
            />
            <span>{{ Math.round(seekPreview ?? speechPosition) }}%</span>
            <button
              class="speech-settings"
              :aria-label="t('文章音色设置')"
              :title="t('文章音色设置')"
              @click="openVoiceSettings"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <span class="speech-sr-status" role="status">{{
              showSpeechLoading ? t('正在加载语音…') : ''
            }}</span>
          </div>
        </div>
      </section>
      <h1 class="article-title">{{ active.title }}</h1>
      <div
        :lang="active?.reading.language"
        dir="auto"
        class="reading-paper"
        :class="{ 'speech-follow': speechActive }"
      >
        <span
          v-for="(sentence, si) in displayedSentences"
          :id="`sentence-${si}`"
          :key="si"
          :data-sentence="si"
          class="sentence"
          :class="{
            current: currentSentence === si,
            speaking: speakingSentence === si,
            analyzing: isSentenceAnalyzing(
              sentence.tokens.map((token) => token.text).join('') + sentence.trailing,
            ),
            cached: !!cachedAnalysis(
              sentence.tokens.map((token) => token.text).join('') + sentence.trailing,
            ),
          }"
        >
          <span
            class="sentence-text sentence-trigger"
            role="button"
            tabindex="0"
            :aria-label="speechActive ? t('播放此句，长按查看解析') : t(`查看第 ${si + 1} 句解析`)"
            :aria-description="speechActive ? t('按 Shift+Enter 查看解析') : undefined"
            :aria-busy="
              isSentenceAnalyzing(
                sentence.tokens.map((token) => token.text).join('') + sentence.trailing,
              )
            "
            @pointerdown="beginSentencePress($event, si)"
            @pointermove="moveSentencePress"
            @pointerup="clearSentencePress"
            @pointercancel="cancelSentencePress"
            @pointerleave="cancelSentencePress"
            @contextmenu="sentenceContextMenu($event, si)"
            @click="activateSentence(si)"
            @keydown.enter.prevent="sentenceKey($event, si)"
            @keydown.space.prevent="sentenceKey($event, si)"
            :class="{
              'has-ruby':
                state.ruby &&
                active?.reading.language === 'ja' &&
                sentence.tokens.some((token) => token.ruby.some((part) => !!part.reading)),
            }"
            :lang="active.reading.language"
          >
            <template v-for="(token, ti) in sentence.tokens" :key="ti"
              ><span v-if="token.kind === 'separator'" class="separator">{{
                paragraphSpacing(token.text)
              }}</span
              ><span v-else class="word"
                ><template v-for="(part, pi) in token.ruby" :key="pi"
                  ><ruby v-if="state.ruby && active?.reading.language === 'ja' && part.reading"
                    >{{ part.text }}<rt>{{ part.reading }}</rt></ruby
                  ><template v-else>{{ part.text }}</template></template
                ></span
              ></template
            ></span
          ><span class="sentence-whitespace">{{ paragraphSpacing(sentence.trailing) }}</span></span
        >
      </div>
    </template>
    <p v-if="error && !importer?.open" class="error" role="alert">{{ t(error) }}</p>
    <p v-if="fileBusy" class="notice" role="status">{{ t('正在读取文件…') }}</p>
    <div v-if="storageError" class="notice" role="status">
      {{ t(storageError) }} <button @click="persist">{{ t('重试保存') }}</button>
    </div>
    <input
      ref="fileInput"
      class="file-input"
      type="file"
      accept=".txt,.md,text/plain,text/markdown"
      :aria-label="t('选择文本文件')"
      @change="chooseFile"
    />
    <dialog
      ref="deleteSheet"
      class="word-sheet delete-sheet"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      @close="deleteTarget = null"
    >
      <header class="word-sheet-header">
        <button
          class="close lingrove-sheet-close"
          :aria-label="t('关闭删除确认')"
          autofocus
          @click="deleteSheet?.close()"
        >
          ×
        </button>
        <h2 id="delete-title">{{ t('删除文章？') }}</h2>
      </header>
      <div class="word-sheet-content">
        <p class="delete-article-title">{{ deleteTarget?.title }}</p>
        <p id="delete-description" class="hint">
          {{ t('文章、解析缓存和阅读记录将一并删除，正在进行的分析会停止。删除后无法恢复。') }}
        </p>
        <div class="editor-footer">
          <button class="primary confirm-delete" @click="confirmDelete">{{ t('确认删除') }}</button>
        </div>
      </div>
    </dialog>
    <dialog
      ref="importer"
      class="word-sheet import-sheet"
      aria-labelledby="import-title"
      @cancel.prevent="closeImport"
    >
      <header class="word-sheet-header">
        <button class="close lingrove-sheet-close" :aria-label="t('关闭导入')" @click="closeImport">
          ×
        </button>
        <h2 id="import-title">{{ t(origin === '文本导入' ? '导入文本' : '导入文件') }}</h2>
      </header>
      <div class="word-sheet-content">
        <p class="hint">
          {{
            t(origin === '文本导入' ? '粘贴文章并选择语言；日语文章会提前生成假名注音。' : origin)
          }}
        </p>
        <form class="article-form" @submit.prevent="start">
          <label for="article-language">{{ t('文章语言') }}</label>
          <select
            id="article-language"
            v-model="state.draftLanguage"
            :disabled="submitting"
            @change="persist"
          >
            <option v-for="language in languages" :key="language.id" :value="language.id">
              {{ t(language.name) }}
            </option>
          </select>
          <label for="article-title">{{ t('文章标题') }}</label
          ><input
            id="article-title"
            v-model="importTitle"
            maxlength="120"
            :disabled="submitting"
          /><label for="source">{{ t('原文') }}</label
          ><textarea
            id="source"
            v-model="state.draft"
            :maxlength="MAX_ARTICLE_LENGTH"
            :disabled="submitting"
            :lang="state.draftLanguage"
            @compositionstart="composing = true"
            @compositionend="composing = false"
          ></textarea>
          <p class="hint">
            {{ state.draft.length.toLocaleString() }} / {{ t(MAX_ARTICLE_LENGTH.toLocaleString()) }}
            {{ t('字符 · 文件支持 UTF-8 编码的 TXT / Markdown') }}
          </p>
          <label for="import-tags">{{ t('标签') }}</label>
          <input
            id="import-tags"
            v-model="state.draftTags"
            :placeholder="t('用逗号分隔多个标签')"
            :disabled="submitting"
          />
          <p v-if="error" class="error" role="alert">{{ t(error) }}</p>
          <div class="editor-footer">
            <button class="primary" :disabled="submitting || !state.draft.trim()">
              {{ t(submitting ? '正在提交…' : '加入书架并分析') }}
            </button>
          </div>
        </form>
      </div>
    </dialog>
    <dialog
      ref="editSheet"
      class="word-sheet edit-sheet"
      aria-labelledby="edit-title"
      @cancel.prevent="closeArticleEditor"
    >
      <header class="word-sheet-header">
        <button
          class="close lingrove-sheet-close"
          :aria-label="t('关闭文章编辑')"
          @click="closeArticleEditor"
        >
          ×
        </button>
        <h2 id="edit-title">{{ t('编辑文章') }}</h2>
      </header>
      <div class="word-sheet-content">
        <form class="article-form" @submit.prevent="saveArticleEdit">
          <label for="edit-language">{{ t('文章语言') }}</label>
          <select
            id="edit-language"
            v-model="editDraft.language"
            :disabled="editBusy"
            @change="updateEditLanguage"
          >
            <option v-for="language in languages" :key="language.id" :value="language.id">
              {{ t(language.name) }}
            </option>
          </select>
          <label for="edit-article-title">{{ t('文章标题') }}</label>
          <input
            id="edit-article-title"
            v-model="editDraft.title"
            maxlength="120"
            :disabled="editBusy"
          />
          <label for="edit-origin">{{ t('文章来源') }}</label>
          <input id="edit-origin" v-model="editDraft.origin" :disabled="editBusy" />
          <label for="edit-source">{{ t('原文') }}</label>
          <textarea
            id="edit-source"
            v-model="editDraft.source"
            :lang="editDraft.language"
            dir="auto"
            :maxlength="MAX_ARTICLE_LENGTH"
            :disabled="editBusy"
          ></textarea>
          <label for="edit-tags">{{ t('标签') }}</label>
          <input
            id="edit-tags"
            v-model="editDraft.tags"
            :placeholder="t('用逗号分隔多个标签')"
            :disabled="editBusy"
          />
          <VoiceField
            id="edit-voice"
            v-model="editDraft.voice"
            :language="editDraft.language"
            :options="voiceOptions"
            :loading="voiceLoading"
            :error="voiceError"
            :disabled="editBusy"
            @retry="loadVoices"
          />
          <p class="hint">
            {{ t('仅用于当前文章，下次打开仍有效。选择后优先于应用设置中的音色。') }}
          </p>
          <p v-if="editBusy" class="hint" role="status">{{ t('正在保存并更新阅读内容…') }}</p>
          <p v-if="editError" class="error" role="alert">{{ t(editError) }}</p>
          <div class="editor-footer">
            <button type="button" class="text-button" @click="closeArticleEditor">
              {{ t('取消') }}</button
            ><button class="primary" :disabled="editBusy || !editDraft.source.trim()">
              {{ t('保存修改') }}
            </button>
          </div>
        </form>
      </div>
    </dialog>
    <dialog
      ref="voiceSheet"
      class="word-sheet voice-sheet"
      aria-labelledby="voice-title"
      @click="$event.target === voiceSheet && voiceSheet?.close()"
    >
      <header class="word-sheet-header">
        <button
          class="close lingrove-sheet-close"
          :aria-label="t('关闭音色设置')"
          @click="voiceSheet?.close()"
        >
          ×
        </button>
        <h2 id="voice-title">{{ t('文章音色设置') }}</h2>
      </header>
      <div class="word-sheet-content voice-settings-content">
        <form class="article-form" @submit.prevent="voiceSheet?.close()">
          <p class="hint">
            {{ t('仅用于当前文章，下次打开仍有效。选择后优先于应用设置中的音色。') }}
          </p>
          <VoiceField
            id="playback-voice"
            :model-value="active?.speechVoice ?? ''"
            :language="active?.reading.language ?? ''"
            :options="voiceOptions"
            :loading="voiceLoading"
            :error="voiceError"
            @update:model-value="changeArticleVoice"
            @retry="loadVoices"
          />
          <div class="editor-footer">
            <button class="primary">{{ t('完成') }}</button>
          </div>
        </form>
      </div>
    </dialog>
    <dialog ref="jobSheet" class="word-sheet" aria-labelledby="job-title">
      <template v-if="selectedJob"
        ><header class="word-sheet-header">
          <button
            class="close lingrove-sheet-close"
            :aria-label="t('关闭分析进度')"
            @click="jobSheet?.close()"
          >
            ×
          </button>
          <h2 id="job-title">{{ t(jobLabel(selectedJob)) }}</h2>
        </header>
        <div class="word-sheet-content">
          <p>{{ selectedJob.title }}</p>
          <progress
            :value="selectedJob.done"
            :max="selectedJob.total"
            :aria-label="t('文章分析进度')"
          ></progress>
          <p class="hint" role="status">
            {{ t('已完成') }} {{ t(selectedJob.done) }} / {{ t(selectedJob.total) }} {{ t('段。')
            }}{{
              t(
                selectedJob.status === 'running' && selectedJob.language === 'ja'
                  ? '正在生成下一段的假名注音。'
                  : '',
              )
            }}
          </p>
          <section v-if="currentDetail" class="analysis-progress-detail">
            <p v-if="currentDetail.requestStatus" class="hint">
              {{ t('本次请求：') }}{{ t(formatLLMStatus(currentDetail.requestStatus)) }}
            </p>
            <h3>
              {{
                t(
                  selectedJob.status === 'running' || selectedJob.status === 'ready'
                    ? stageName
                    : '上次进度',
                )
              }}
            </h3>
            <p v-if="currentDetail.attempt > 1" class="hint">
              {{ t('当前段第') }} {{ t(currentDetail.attempt) }} {{ t('次请求（自动重试）') }}
            </p>
            <dl>
              <div>
                <dt>{{ t('当前段落') }}</dt>
                <dd>
                  {{ t(currentDetail.current) }} / {{ t(selectedJob.total) }} {{ t('· 原文第') }}
                  {{ t(currentDetail.start) }}–{{ t(currentDetail.end) }} {{ t('字符') }}
                </dd>
              </div>
              <div>
                <dt>{{ t('段落完成率') }}</dt>
                <dd>{{ t(Math.floor((selectedJob.done / selectedJob.total) * 100)) }}%</dd>
              </div>
              <div>
                <dt>{{ t('已接收模型输出') }}</dt>
                <dd>{{ t(currentDetail.received.toLocaleString()) }} {{ t('字符') }}</dd>
              </div>
              <div>
                <dt>{{ t('已校验内容') }}</dt>
                <dd>
                  {{ t(currentDetail.sentences) }} {{ t('句 ·') }} {{ t(currentDetail.words) }}
                  {{ t('个词语') }}
                </dd>
              </div>
              <div>
                <dt>{{ t('本次耗时') }}</dt>
                <dd>
                  {{
                    t(
                      Math.max(
                        0,
                        Math.floor(
                          ((currentDetail.endedAt ?? now) - currentDetail.startedAt) / 1000,
                        ),
                      ),
                    )
                  }}
                  {{ t('秒') }}
                </dd>
              </div>
            </dl>
            <p
              v-if="selectedJob.status === 'running' && now - currentDetail.updatedAt > 15000"
              class="hint"
            >
              {{ t(Math.floor((now - currentDetail.updatedAt) / 1000)) }}
              {{ t('秒未收到新内容，仍在等待模型响应。') }}
            </p>
            <blockquote :lang="selectedJob.language" dir="auto">
              {{ currentDetail.preview
              }}{{ currentDetail.end - currentDetail.start + 1 > 100 ? '…' : '' }}
            </blockquote>
            <p class="hint">
              {{ t('百分比按已完成段落计算；接收字符数是模型返回数据量，不代表已完成比例。') }}
            </p>
          </section>
          <p
            v-if="selectedJob.status === 'queued' || selectedJob.status === 'running'"
            class="hint"
          >
            {{ t('关闭弹窗后会继续分析，可以阅读其他文章。退出应用或系统挂起可能中断任务。') }}
          </p>
          <p v-if="selectedJob.parts?.length" class="hint">
            {{ t('已保存') }} {{ t(selectedJob.parts.length) }}
            {{ t('段预处理结果，重试会复用。') }}
          </p>
          <p v-if="selectedJob.error" class="error">{{ t(selectedJob.error) }}</p>
          <div class="editor-footer">
            <button
              v-if="selectedJob.status === 'running' || selectedJob.status === 'queued'"
              class="secondary"
              @click="pauseJob(selectedJob)"
            >
              {{ t('暂停分析') }}</button
            ><button
              v-else-if="selectedJob.status === 'ready'"
              class="primary"
              @click="readCompletedJob(selectedJob)"
            >
              {{ t('开始阅读') }}</button
            ><button v-else class="primary" @click="retryJob(selectedJob)">
              {{ t('继续分析') }}
            </button>
          </div>
        </div></template
      >
    </dialog>
    <dialog
      ref="sheet"
      class="word-sheet analysis-sheet"
      aria-labelledby="analysis-title"
      @pointerdown="sentencePointerStartedOutside = isOutsideSentenceSheet($event)"
      @pointercancel="sentencePointerStartedOutside = false"
      @click="closeSentenceFromBackdrop"
      @close="resumeAfterAnalysis"
    >
      <header class="word-sheet-header">
        <button
          class="close lingrove-sheet-close"
          :aria-label="t('关闭句子解析')"
          autofocus
          @click="sheet?.close()"
        >
          ×
        </button>
        <h2 id="analysis-title">{{ t('句子解析') }}</h2>
      </header>
      <div class="word-sheet-content">
        <p class="analysis-original" :lang="active?.reading.language">{{ sentenceText }}</p>
        <p v-if="sentenceBusy" role="status" class="notice sentence-progress">
          <span>{{ t('正在分析句子结构与语法…') }}</span>
          <span v-for="line in formatLLMStatus(sentenceStatus).split(' · ')" :key="line">{{
            line
          }}</span>
        </p>
        <div v-else-if="sentenceError" role="alert" class="error">
          {{ t(sentenceError)
          }}<button class="text-button" @click="startSentenceAnalysis">{{ t('重试解析') }}</button>
        </div>
        <div v-else-if="sentenceResult" class="analysis-results">
          <article class="result-card">
            <span class="eyebrow">{{ t('翻译') }}</span>
            <p>{{ sentenceResult.translation }}</p>
          </article>
          <article class="result-card">
            <span class="eyebrow">{{ t('句子结构') }}</span>
            <p>{{ sentenceResult.summary }}</p>
          </article>
          <article
            v-for="(correction, ci) in sentenceResult.corrections"
            :key="ci"
            class="result-card"
          >
            <span class="eyebrow">{{ t('语法修正') }}</span>
            <p>
              <del>{{ correction.original }}</del> → <strong>{{ correction.corrected }}</strong>
            </p>
            <p>{{ correction.explanation }}</p>
          </article>
          <div class="structure analysis-components">
            <table class="structure-table">
              <colgroup>
                <col class="structure-text" />
                <col class="structure-part" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">{{ t('句子成分') }}</th>
                  <th scope="col">{{ t('词性') }}</th>
                  <th scope="col">{{ t('作用说明') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(part, pi) in sentenceResult.structure" :key="pi">
                  <th scope="row">
                    <span :lang="active?.reading.language" dir="auto">{{ part.text }}</span
                    ><span class="component-translation">{{ part.translation }}</span>
                  </th>
                  <td>{{ part.part }}</td>
                  <td>{{ part.role }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <article
            v-for="(point, pi) in sentenceResult.grammar_points"
            :key="pi"
            class="result-card"
          >
            <h3>{{ point.title }}</h3>
            <p>{{ point.explanation }}</p>
            <div class="tags">
              <span
                v-for="(form, fi) in point.inflections"
                :key="fi"
                :lang="active?.reading.language"
                >{{ form }}</span
              >
            </div>
          </article>
        </div>
        <div v-else class="editor-footer">
          <button class="primary analyze-sentence" @click="startSentenceAnalysis">
            {{ t('分析') }}
          </button>
        </div>
      </div>
    </dialog>
  </main>
  <nav v-if="page !== 'reader'" class="bottom-tabs lingrove-bottom-tabs" :aria-label="t('主导航')">
    <button :aria-current="page === 'library' ? 'page' : undefined" @click="navigate('library')">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5c-4-3-8-1-9 0v15c3-2 6-2 9 0 3-2 6-2 9 0V5c-3-2-6-2-9 0Zm0 0v15" /></svg
      >{{ t('书架') }}</button
    ><button :aria-current="page === 'data' ? 'page' : undefined" @click="navigate('data')">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M6 16v-4m6 4V4m6 12V8" /></svg
      >{{ t('我的') }}
    </button>
  </nav>
</template>
