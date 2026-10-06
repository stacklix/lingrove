<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t } = useAppI18n();
import { computed } from 'vue';
import { isSentenceComponent, type Action } from '../models';
import CopyButton from './CopyButton.vue';
const props = defineProps<{ action: Action; data: Record<string, any> }>();
// Also filter streamed results and previously saved history.
const structure = computed(() =>
  (props.data.structure || []).filter((item: { text?: string }) => isSentenceComponent(item.text)),
);
const styleLabels: Record<string, string> = {
  natural: '自然表达',
  conversational: '日常口语',
  polite: '礼貌表达',
};
</script>
<template>
  <div class="results">
    <template v-if="action === 'translate'">
      <article v-for="(item, index) in data.translations || []" :key="index" class="result-card">
        <div class="card-top">
          <span class="eyebrow">{{ t(index === 0 ? '01 · 直译' : '02 · 地道表达') }}</span
          ><CopyButton v-if="item.text" :text="item.text" />
        </div>
        <p class="translation">{{ item.text }}</p>
        <p v-if="typeof item.reading === 'string' && item.reading" class="kana-reading" lang="ja">
          <span>假名</span>{{ item.reading }}
        </p>
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
