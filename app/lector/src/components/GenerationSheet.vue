<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue';
import { formatLLMStatus, type LLMStatus } from '@lingrove/host-sdk';
import { useAppI18n } from '@lingrove/host-sdk/vue';
import { languages } from '../model';
import {
  countsCharacters,
  generateArticle,
  generationLevels,
  generationTopics,
  type GeneratedArticle,
  validGenerationPreferences,
  type GenerationPreferences,
} from '../generation';

const { t } = useAppI18n();
const props = defineProps<{ preferences: GenerationPreferences }>();
const emit = defineEmits<{
  generated: [article: GeneratedArticle];
  closed: [];
  preferencesChange: [preferences: GenerationPreferences];
}>();
const dialog = ref<HTMLDialogElement>();
const form = reactive({
  ...props.preferences,
  constraints: '',
});
const levels = computed(() => generationLevels(form.language));
watch(
  () => form.language,
  () => {
    if (!levels.value.includes(form.level)) form.level = levels.value[0]!;
  },
);
const busy = ref(false);
const error = ref('');
const status = ref<LLMStatus>();
let controller: AbortController | undefined;
watch(
  () => ({
    language: form.language,
    level: form.level,
    topic: form.topic,
    customTopic: form.customTopic,
    length: Number(form.length),
  }),
  (preferences) => {
    if (validGenerationPreferences(preferences)) emit('preferencesChange', preferences);
  },
  { flush: 'post' },
);

function open() {
  Object.assign(form, props.preferences);
  error.value = '';
  dialog.value?.showModal();
}
function cancelGeneration() {
  controller?.abort();
  controller = undefined;
  busy.value = false;
  status.value = undefined;
}
function close() {
  cancelGeneration();
  dialog.value?.close();
  emit('closed');
}
async function generate() {
  if (busy.value) return;
  const request = new AbortController();
  controller = request;
  busy.value = true;
  error.value = '';
  status.value = undefined;
  try {
    const article = await generateArticle(
      {
        language: form.language,
        level: form.level,
        topic:
          form.topic === 'custom'
            ? form.customTopic
            : generationTopics.find((topic) => topic.id === form.topic)!.label,
        length: Number(form.length),
        constraints: form.constraints,
      },
      {
        signal: request.signal,
        onStatus: (value) => {
          if (controller === request) status.value = value;
        },
      },
    );
    if (controller !== request || request.signal.aborted) return;
    close();
    emit('generated', article);
  } catch (cause) {
    if (controller === request && !request.signal.aborted)
      error.value = cause instanceof Error ? cause.message : '未能生成完整文章，请重试。';
  } finally {
    if (controller === request) {
      controller = undefined;
      busy.value = false;
    }
  }
}
onUnmounted(cancelGeneration);
defineExpose({ open });
</script>

<template>
  <dialog
    ref="dialog"
    class="word-sheet generation-sheet"
    aria-labelledby="generation-title"
    @cancel.prevent="close"
    @close="cancelGeneration"
  >
    <header class="word-sheet-header">
      <button class="close lingrove-sheet-close" :aria-label="t('关闭 AI 生成')" @click="close">
        ×
      </button>
      <h2 id="generation-title">{{ t('AI 生成文章') }}</h2>
    </header>
    <div class="word-sheet-content">
      <p class="hint">{{ t('按学习目标生成文章，预览并编辑后加入书架。') }}</p>
      <form class="article-form" :aria-busy="busy" @submit.prevent="generate">
        <div class="generation-fields">
          <div>
            <label for="generation-language">{{ t('文章语言') }}</label>
            <select id="generation-language" v-model="form.language" :disabled="busy">
              <option v-for="language in languages" :key="language.id" :value="language.id">
                {{ t(language.name) }}
              </option>
            </select>
          </div>
          <div>
            <label for="generation-level">{{ t('难度') }}</label>
            <select id="generation-level" v-model="form.level" :disabled="busy">
              <option v-for="level in levels" :key="level" :value="level">{{ t(level) }}</option>
            </select>
          </div>
        </div>
        <label for="generation-topic">{{ t('主题') }}</label>
        <select id="generation-topic" v-model="form.topic" :disabled="busy">
          <option v-for="topic in generationTopics" :key="topic.id" :value="topic.id">
            {{ t(topic.label) }}
          </option>
        </select>
        <template v-if="form.topic === 'custom'">
          <label for="generation-custom-topic">{{ t('自定义主题') }}</label>
          <input
            id="generation-custom-topic"
            v-model="form.customTopic"
            required
            maxlength="200"
            :disabled="busy"
          />
        </template>
        <label for="generation-length">{{
          t(countsCharacters(form.language) ? '字数（字符）' : '字数（单词）')
        }}</label>
        <input
          id="generation-length"
          v-model="form.length"
          type="number"
          inputmode="numeric"
          min="50"
          max="2000"
          step="1"
          required
          :disabled="busy"
          aria-describedby="generation-length-hint"
        />
        <p id="generation-length-hint" class="hint">
          {{ t('范围 50–2000，生成长度可能略有浮动。') }}
        </p>
        <label for="generation-constraints">{{ t('自定义限制（可选）') }}</label>
        <textarea
          id="generation-constraints"
          v-model="form.constraints"
          maxlength="1000"
          :disabled="busy"
          :placeholder="t('例如：使用对话形式、包含指定词汇、避免某些内容。')"
        ></textarea>
        <p v-if="error" class="error" role="alert">{{ t(error) }}</p>
        <p v-if="busy" class="hint" role="status">
          {{ t('正在生成文章…') }}<br />{{
            status ? t(formatLLMStatus(status)) : t('等待模型响应')
          }}
        </p>
        <div class="editor-footer">
          <button v-if="busy" type="button" @click="cancelGeneration">{{ t('取消生成') }}</button>
          <button class="primary" :disabled="busy">{{ t(busy ? '正在生成…' : '生成文章') }}</button>
        </div>
      </form>
    </div>
  </dialog>
</template>
