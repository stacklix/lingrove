<script setup lang="ts">
import { computed } from 'vue';
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t } = useAppI18n();
const props = defineProps<{
  id: string;
  modelValue: string;
  language: string;
  options: { id: string; title: string; language: string }[];
  loading: boolean;
  error: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string]; retry: [] }>();
const filtered = computed(() =>
  props.options.filter((v) => !v.language || v.language === props.language),
);
</script>
<template>
  <div class="form-field">
    <label :for="id">{{ t('音色') }}</label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled || loading || !!error"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ t('跟随应用设置') }}</option>
      <option
        v-if="modelValue && !filtered.some((v) => v.id === modelValue)"
        :value="modelValue"
        disabled
      >
        {{ t('所选音色不可用，请重新选择。') }}
      </option>
      <option v-for="voice in filtered" :key="voice.id" :value="voice.id">
        {{ t(voice.title) }}
      </option>
    </select>
    <p v-if="loading" class="hint" role="status">{{ t('正在加载音色…') }}</p>
    <p v-else-if="error" class="error" role="alert">
      {{ t(error) }}
      <button type="button" class="text-button" @click="emit('retry')">{{ t('重试') }}</button>
    </p>
    <p v-else-if="!filtered.length" class="hint">
      {{ t('当前没有该语言的可选音色，可跟随应用设置。') }}
    </p>
  </div>
</template>
