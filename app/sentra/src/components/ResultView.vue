<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t } = useAppI18n();
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { isNative, tts, type TTSPlayback, type TTSPlaybackState } from '@lingrove/host-sdk';
import { isSentenceComponent, languageCode, type Action } from '../models';
import CopyButton from './CopyButton.vue';
import RubySentence from './RubySentence.vue';
const props = withDefaults(
  defineProps<{ action: Action; data: Record<string, any>; playbackEnabled?: boolean }>(),
  { playbackEnabled: true },
);
const playingIndex = ref<number | null>(null);
const playbackState = ref<TTSPlaybackState>('stopped');
const failedIndex = ref<number | null>(null);
const playbackError = ref('');
let playback: TTSPlayback | undefined;
let stoppingPlayback = Promise.resolve();
let generation = 0;
function stopPlayback() {
  generation++;
  const previous = playback;
  playback = undefined;
  playingIndex.value = null;
  playbackState.value = 'stopped';
  const stopping = previous?.stop() ?? stoppingPlayback;
  stoppingPlayback = stopping.catch(() => {});
  return stopping;
}
function resetPlayback() {
  void stopPlayback().catch(() => {});
  failedIndex.value = null;
  playbackError.value = '';
}
watch(() => [props.action, props.data, props.playbackEnabled], resetPlayback, {
  deep: true,
  flush: 'sync',
});
onBeforeUnmount(resetPlayback);
function playbackLabel(index: number) {
  return t(
    playingIndex.value === index
      ? playbackState.value === 'buffering'
        ? '取消播放'
        : '停止播放'
      : failedIndex.value === index
        ? '重试播放'
        : '播放译文',
  );
}
async function togglePlayback(index: number) {
  const text = props.data.translations?.[index]?.text;
  if (!props.playbackEnabled || typeof text !== 'string' || !text.trim()) return;
  const stoppingCurrent = playingIndex.value === index;
  const stopping = stopPlayback();
  const ticket = generation;
  failedIndex.value = null;
  playbackError.value = '';
  if (!stoppingCurrent) {
    playingIndex.value = index;
    playbackState.value = 'buffering';
  }
  let failure = '播放失败，请点击重试。';
  try {
    await stopping;
    if (ticket !== generation || stoppingCurrent) return;
    if (!isNative()) {
      failure = '请在 Lingrove 中播放译文。';
      throw new Error(failure);
    }
    const status = await tts.status();
    if (ticket !== generation) return;
    if (!status.configured) {
      failure = '请先前往「应用设置 → 语音合成」完成设置。';
      throw new Error(failure);
    }
    const chunks = text.match(/[\s\S]{1,1900}/gu)!;
    playback = tts.play(
      {
        text: chunks[0],
        ...(typeof props.data.translation_language === 'string'
          ? { language: languageCode(props.data.translation_language) }
          : {}),
      },
      {
        title: t(index === 0 ? '01 · 直译' : '02 · 地道表达'),
        ...(chunks.length > 1 ? { queue: chunks } : {}),
        onState: (state) => {
          if (ticket !== generation) return;
          playbackState.value = state;
          if (state === 'stopped' || state === 'ended') playingIndex.value = null;
        },
      },
    );
    await playback.finished;
  } catch (error) {
    if (ticket === generation && !(error instanceof Error && error.name === 'AbortError')) {
      failedIndex.value = index;
      playbackError.value = failure;
    }
  } finally {
    if (ticket === generation) {
      playback = undefined;
      playingIndex.value = null;
      playbackState.value = 'stopped';
    }
  }
}
// Also filter streamed results and previously saved history.
const structure = computed(() =>
  (props.data.structure || []).filter((item: { text?: string }) => isSentenceComponent(item.text)),
);
const translations = computed<Record<string, any>[]>(() => props.data.translations || []);
const styleLabels: Record<string, string> = {
  natural: '自然表达',
  conversational: '日常口语',
  polite: '礼貌表达',
};
</script>
<template>
  <div class="results">
    <template v-if="action === 'translate'">
      <article v-if="data.source_text && data.source_ruby" class="result-card">
        <span class="eyebrow">{{ t('原句读音') }}</span>
        <RubySentence :text="data.source_text" :parts="data.source_ruby" />
      </article>
      <article v-for="(item, index) in translations" :key="index" class="result-card">
        <div class="card-top">
          <span class="eyebrow">{{ t(index === 0 ? '01 · 直译' : '02 · 地道表达') }}</span
          ><CopyButton v-if="item.text" :text="item.text" />
        </div>
        <RubySentence v-if="item.ruby" :text="item.text" :parts="item.ruby" />
        <p v-else class="translation">{{ item.text }}</p>
        <div class="translation-playback">
          <p v-if="failedIndex === index" class="translation-playback-error" role="alert">
            {{ t(playbackError) }}
          </p>
          <button
            type="button"
            class="translation-play-button"
            :disabled="!playbackEnabled || !item.text?.trim()"
            :aria-label="playbackLabel(index)"
            :title="playbackLabel(index)"
            :aria-pressed="playingIndex === index"
            :aria-busy="playingIndex === index && playbackState === 'buffering'"
            @click="togglePlayback(index)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-if="playingIndex === index && playbackState === 'buffering'"
                d="m6 6 12 12M6 18 18 6"
              />
              <rect v-else-if="playingIndex === index" x="6" y="6" width="12" height="12" rx="1" />
              <path v-else-if="failedIndex === index" d="M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6" />
              <path v-else d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
            </svg>
          </button>
        </div>
      </article>
      <aside v-if="data.notes?.length" class="note">
        <span class="eyebrow">{{ t('表达笔记') }}</span>
        <p v-for="(note, i) in data.notes" :key="i">{{ note }}</p>
      </aside>
    </template>
    <template v-else-if="action === 'grammar'">
      <article
        v-if="typeof data.analysis_reading === 'string' && data.analysis_reading"
        class="result-card"
      >
        <span class="eyebrow">{{ t('原句读音') }}</span>
        <p lang="ja">{{ data.analysis_text }}</p>
        <p class="kana-reading" lang="ja"><span>假名</span>{{ data.analysis_reading }}</p>
      </article>
      <article v-if="data.summary" class="result-card">
        <span class="eyebrow">{{ t('句子结构') }}</span>
        <p>{{ data.summary }}</p>
      </article>
      <article v-for="(item, i) in data.corrections || []" :key="i" class="result-card">
        <span class="eyebrow">{{ t('语法修正') }}</span>
        <p>
          <del>{{ item.original }}</del> → <strong>{{ item.corrected }}</strong>
        </p>
        <p
          v-if="typeof item.corrected_reading === 'string' && item.corrected_reading"
          class="kana-reading"
          lang="ja"
        >
          <span>假名</span>{{ item.corrected_reading }}
        </p>
        <p>{{ item.explanation }}</p>
      </article>
      <div v-if="structure.length" class="structure">
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
            <tr v-for="(item, i) in structure" :key="i">
              <th scope="row">
                <span>{{ item.text }}</span>
                <span
                  v-if="typeof item.translation === 'string' && item.translation.trim()"
                  class="component-translation"
                  >{{ item.translation }}</span
                >
              </th>
              <td>{{ item.part }}</td>
              <td>{{ item.role }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <article v-for="(item, i) in data.grammar_points || []" :key="i" class="result-card">
        <h3>{{ t(item.title) }}</h3>
        <p>{{ item.explanation }}</p>
        <div class="tags">
          <span v-for="(form, j) in item.inflections || []" :key="j">{{ t(form) }}</span>
        </div>
      </article>
    </template>
    <template v-else>
      <aside v-if="data.naturalness" class="note">{{ data.naturalness }}</aside>
      <article v-for="(item, i) in data.alternatives || []" :key="i" class="result-card">
        <div class="card-top">
          <span class="eyebrow">{{ t(styleLabels[item.style] || item.style) }}</span
          ><CopyButton v-if="item.text" :text="item.text" />
        </div>
        <p class="translation">{{ item.text }}</p>
        <p v-if="typeof item.reading === 'string' && item.reading" class="kana-reading" lang="ja">
          <span>假名</span>{{ item.reading }}
        </p>
        <p class="muted">{{ item.translation }}</p>
        <p>{{ item.explanation }}</p>
      </article>
    </template>
  </div>
</template>
