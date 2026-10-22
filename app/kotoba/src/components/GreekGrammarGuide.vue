<script setup lang="ts">
import { computed, nextTick, onDeactivated, onUnmounted, ref } from 'vue';
import { useAppI18n } from '@lingrove/host-sdk/vue';
import { setRootPage } from '@lingrove/host-sdk';
import { greekTopics } from '../greek';
const { t } = useAppI18n();
const selected = ref('overview');
const topicIndex = computed(() => greekTopics.findIndex((item) => item.id === selected.value));
const topic = computed(() => greekTopics[topicIndex.value]);
const directory = ref<HTMLDialogElement>();
let directoryOpener: HTMLElement | null = null;
const directoryOpen = ref(false);
const content = ref<HTMLElement>();
let previousOverflow = '';
function openDirectory() {
  if (directoryOpen.value || !directory.value) return;
  directoryOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  previousOverflow = document.body.style.overflow;
  directory.value.showModal();
  directoryOpen.value = true;
  document.body.style.overflow = 'hidden';
  void setRootPage(false).catch(() => {});
}
function restorePage() {
  if (!directoryOpen.value) return;
  directoryOpen.value = false;
  document.body.style.overflow = previousOverflow;
  void setRootPage(true).catch(() => {});
}
function closeDirectory() {
  directory.value?.close();
  restorePage();
  directoryOpener?.focus();
}
async function selectTopic(id: string) {
  selected.value = id;
  closeDirectory();
  await nextTick();
  document.documentElement.scrollTop = 0;
  content.value?.focus({ preventScroll: true });
}
onDeactivated(closeDirectory);
onUnmounted(restorePage);
defineExpose({ openDirectory, directoryOpen });
</script>

<template>
  <section class="grammar-guide greek-guide" :aria-label="t('语法手册')">
    <div class="intro">
      <p class="eyebrow">{{ t('从规则，理解变化') }}</p>
      <h1>{{ t('语法手册') }}</h1>
      <p class="subtitle">{{ t('现代希腊语 · 从词类、性数格到时态与句法。') }}</p>
    </div>
    <dialog
      id="greek-directory"
      ref="directory"
      class="directory-sheet"
      aria-labelledby="greek-directory-title"
      @cancel.prevent="closeDirectory"
      @close="restorePage"
      @click="$event.target === directory && closeDirectory()"
    >
      <div class="directory-heading">
        <h2 id="greek-directory-title">{{ t('目录') }}</h2>
        <button
          type="button"
          class="lingrove-sheet-close"
          :aria-label="t('关闭目录')"
          @click="closeDirectory"
        >
          ×
        </button>
      </div>
      <div class="directory-inner">
        <p class="directory-current">{{ t('正在阅读：') }}{{ t(topic.title) }}</p>
        <div class="guide-topics greek-directory">
          <button
            v-for="(item, index) in greekTopics"
            :key="item.id"
            type="button"
            :aria-pressed="selected === item.id"
            @click="selectTopic(item.id)"
          >
            <span>{{ String(index + 1).padStart(2, '0') }}</span
            >{{ t(item.title) }}
          </button>
        </div>
      </div>
    </dialog>
    <article ref="content" class="guide-content" tabindex="-1">
      <p class="grammar-level">
        {{ String(topicIndex + 1).padStart(2, '0') }} / {{ greekTopics.length }} ·
        {{ t('现代希腊语') }}
      </p>
      <h2>{{ t(topic.title) }}</h2>
      <p class="guide-intro">{{ t(topic.intro) }}</p>
      <div
        v-if="topic.table"
        class="grammar-table-scroll"
        role="region"
        :aria-label="t(topic.title)"
        tabindex="0"
      >
        <table class="grammar-mapping-table greek-table">
          <thead>
            <tr>
              <th v-for="column in topic.table.columns" :key="column" scope="col">
                {{ t(column) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in topic.table.rows" :key="row[0]">
              <th scope="row">{{ t(row[0]) }}</th>
              <td v-for="(cell, index) in row.slice(1)" :key="index">{{ t(cell) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="guide-rules school-rules">
        <section v-for="rule in topic.rules" :key="rule.name" class="guide-rule">
          <h3>{{ t(rule.name) }}</h3>
          <p>{{ t(rule.rule) }}</p>
          <div class="grammar-sentence">
            <p lang="el">{{ rule.example }}</p>
            <p class="grammar-sentence-translation">{{ t(rule.translation) }}</p>
          </div>
        </section>
      </div>
      <p v-if="topic.note" class="guide-note">{{ t(topic.note) }}</p>
    </article>
    <nav class="guide-chapters" :aria-label="t('章节导航')">
      <button
        v-if="topicIndex > 0"
        type="button"
        class="text-button"
        @click="selectTopic(greekTopics[topicIndex - 1].id)"
      >
        ← {{ t(greekTopics[topicIndex - 1].title) }}
      </button>
      <button
        v-if="topicIndex < greekTopics.length - 1"
        type="button"
        class="text-button next-chapter"
        @click="selectTopic(greekTopics[topicIndex + 1].id)"
      >
        {{ t('下一章：') }}{{ t(greekTopics[topicIndex + 1].title) }} →
      </button>
    </nav>
    <details class="guide-sources">
      <summary>{{ t('参考资料') }}</summary>
      <p>{{ t('规则与例子按学习需要整理。可继续阅读：') }}</p>
      <a
        href="https://www.greek-language.gr/digitalResources/modern_greek/tools/lexica/glossology_edu/iframe.html?heading=5&amp;id=79"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('希腊语中心 · 性、数、格') }}</a
      >
      <a
        href="https://ebooks.edu.gr/ebooks/v/html/8547/2334/Grammatiki-Neas-Ellinikis-Glossas_A-B-G-Gymnasiou_html-apli/index_C_03.html"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('希腊教育部 · 现代希腊语语法：形容词') }}</a
      >
      <a
        href="https://ebooks.edu.gr/ebooks/v/html/8547/2334/Grammatiki-Neas-Ellinikis-Glossas_A-B-G-Gymnasiou_html-apli/index_C_06.html"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('希腊教育部 · 现代希腊语语法：动词') }}</a
      >
    </details>
  </section>
</template>
