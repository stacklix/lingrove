<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t } = useAppI18n();
import { computed, nextTick, onDeactivated, onUnmounted, ref } from 'vue';
import { setRootPage } from '@lingrove/host-sdk';
import { grammarTopics } from '../grammar';
import SpecialVerbsSheet from './SpecialVerbsSheet.vue';
const selected = ref('comparison');
const directory = ref<HTMLDialogElement>();
const directoryButton = ref<HTMLButtonElement>();
const content = ref<HTMLElement>();
const directoryOpen = ref(false);
let previousOverflow = '';
function openDirectory() {
  if (directoryOpen.value || !directory.value) return;
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
  directoryButton.value?.focus();
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
const topicIndex = computed(() => grammarTopics.findIndex((item) => item.id === selected.value));
const topic = computed(() => grammarTopics.find((item) => item.id === selected.value)!);
const ruleGroups = computed(() => {
  const groups: { title: string; rules: typeof topic.value.rules }[] = [];
  for (const rule of topic.value.rules) {
    const title = rule.group ?? '';
    let group = groups.find((item) => item.title === title);
    if (!group) {
      group = { title, rules: [] };
      groups.push(group);
    }
    group.rules.push(rule);
  }
  return groups;
});
</script>
<template>
  <section class="grammar-guide" :aria-label="t('活用语法手册')">
    <button
      ref="directoryButton"
      type="button"
      class="directory-toggle"
      :aria-label="t('打开目录')"
      aria-haspopup="dialog"
      aria-controls="grammar-directory"
      :aria-expanded="directoryOpen"
      @click="openDirectory"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg
      ><span>{{ t('目录') }}</span>
    </button>
    <div class="intro">
      <p class="eyebrow">{{ t('从规则，理解变化') }}</p>
      <h1>{{ t('日语活用语法') }}</h1>
      <p class="subtitle">{{ t('先理解两套文法与动词分类，再学习动词和形容词的活用规则。') }}</p>
    </div>
    <dialog
      id="grammar-directory"
      ref="directory"
      class="directory-sheet"
      aria-labelledby="directory-title"
      @cancel.prevent="closeDirectory"
      @close="restorePage"
      @click="$event.target === directory && closeDirectory()"
    >
      <div class="directory-heading">
        <h2 id="directory-title">{{ t('目录') }}</h2>
        <button
          type="button"
          class="directory-close lingrove-sheet-close"
          :aria-label="t('关闭目录')"
          @click="closeDirectory"
        >
          ×
        </button>
      </div>
      <div class="directory-inner">
        <p class="directory-current">{{ t('正在阅读：') }}{{ t(topic.title) }}</p>
        <div class="guide-outline" :aria-label="t('学习顺序')">
          <div
            v-for="(stage, index) in ['文法基础', '动词活用规则', '形容词活用规则']"
            :key="stage"
            class="guide-stage"
          >
            <p class="grammar-level">
              {{ t(String(index + 1).padStart(2, '0')) }} · {{ t(stage) }}
            </p>
            <div class="guide-topics" :aria-label="t(stage)">
              <button
                v-for="item in grammarTopics.filter((item) => item.stage === stage)"
                :key="item.id"
                type="button"
                :aria-pressed="selected === item.id"
                @click="selectTopic(item.id)"
              >
                {{ t(item.title) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
    <article ref="content" :key="topic.id" class="guide-content" tabindex="-1">
      <p class="grammar-level">{{ t(topic.stage) }}</p>
      <h2>{{ t(topic.title) }}</h2>
      <p v-if="topic.conjugations" class="grammar-level">{{ t('用途') }}</p>
      <p class="guide-intro">{{ t(topic.intro) }}</p>
      <section v-if="topic.mappings" class="grammar-mappings">
        <h3 class="guide-group-title">{{ t('词类名称的对应') }}</h3>
        <table class="grammar-mapping-table">
          <thead>
            <tr>
              <th scope="col">{{ t('学校文法') }}</th>
              <th scope="col">{{ t('教育文法') }}</th>
              <th scope="col">{{ t('例子') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mapping in topic.mappings" :key="mapping.school">
              <th scope="row">{{ t(mapping.school) }}</th>
              <td>{{ t(mapping.education) }}</td>
              <td>{{ t(mapping.example) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section
        v-if="topic.conjugations"
        class="conjugation-overview"
        :aria-label="t('各类动词的变化规则')"
      >
        <h3 class="guide-group-title">{{ t('变化规则') }}</h3>
        <p class="conjugation-hint">{{ t('以下从辞书形出发，先看动词本身如何变化。') }}</p>
        <div class="conjugation-rows">
          <section v-for="form in topic.conjugations" :key="form.name" class="conjugation-row">
            <h4>{{ t(form.name) }}</h4>
            <dl class="classification-details">
              <div>
                <dt>{{ t('规则') }}</dt>
                <dd>{{ t(form.rule) }}</dd>
              </div>
              <div>
                <dt>{{ t('例子') }}</dt>
                <dd lang="ja">{{ t(form.example) }}</dd>
              </div>
            </dl>
          </section>
        </div>
      </section>
      <section v-for="section in topic.sections" :key="section.title" class="adjective-section">
        <h3 class="guide-group-title">{{ t(section.title) }}</h3>
        <p class="conjugation-hint">{{ t(section.intro) }}</p>
        <h4 class="adjective-subheading">{{ t('学校文法 · 六种活用形') }}</h4>
        <div class="conjugation-rows">
          <section v-for="form in section.forms" :key="form.name" class="conjugation-row">
            <h5>{{ t(form.name) }}</h5>
            <dl class="classification-details">
              <div>
                <dt>{{ t('规则') }}</dt>
                <dd>{{ t(form.rule) }}</dd>
              </div>
              <div v-if="form.example !== '—'">
                <dt>{{ t('例子') }}</dt>
                <dd lang="ja">{{ t(form.example) }}</dd>
              </div>
            </dl>
          </section>
        </div>
        <h4 class="adjective-subheading">{{ t('常用表达') }}</h4>
        <div class="conjugation-rows">
          <section v-for="usage in section.usages" :key="usage.name" class="conjugation-row">
            <h5>{{ t(usage.name) }}</h5>
            <dl class="classification-details">
              <div>
                <dt>{{ t('规则') }}</dt>
                <dd>{{ t(usage.rule) }}</dd>
              </div>
              <div>
                <dt>{{ t('例子') }}</dt>
                <dd lang="ja">{{ t(usage.example) }}</dd>
              </div>
            </dl>
          </section>
        </div>
        <p class="guide-note">{{ t(section.note) }}</p>
      </section>
      <section v-for="group in ruleGroups" :key="group.title" class="guide-rule-group">
        <h3 v-if="group.title" class="guide-group-title">{{ t(group.title) }}</h3>
        <div
          class="guide-rules"
          :class="{
            'classification-rules': topic.id === 'classes',
            'school-rules': !!topic.conjugations || topic.id === 'comparison',
          }"
        >
          <section v-for="rule in group.rules" :key="rule.name" class="guide-rule">
            <template v-if="topic.id === 'classes'">
              <dl class="classification-details">
                <div>
                  <dt>{{ t('构成') }}</dt>
                  <dd>{{ t(rule.rule) }}</dd>
                </div>
                <div>
                  <dt>{{ t('识别') }}</dt>
                  <dd>{{ t(rule.identification) }}</dd>
                </div>
                <div>
                  <dt>{{ t('例子') }}</dt>
                  <dd lang="ja">{{ t(rule.example) }}</dd>
                </div>
              </dl>
            </template>
            <template v-else>
              <component :is="group.title ? 'h4' : 'h3'">{{ t(rule.name) }}</component>
              <dl
                v-if="topic.id === 'comparison'"
                class="classification-details comparison-details usage-details"
              >
                <div>
                  <dt>{{ t('学校文法') }}</dt>
                  <dd>{{ t(rule.school) }}</dd>
                </div>
                <div>
                  <dt>{{ t('教育文法') }}</dt>
                  <dd>{{ t(rule.education) }}</dd>
                </div>
                <div v-if="rule.example">
                  <dt>{{ t('例子') }}</dt>
                  <dd>{{ t(rule.example) }}</dd>
                </div>
              </dl>
              <dl v-else-if="topic.conjugations" class="classification-details usage-details">
                <div>
                  <dt>{{ t('用法') }}</dt>
                  <dd>{{ t(rule.rule) }}</dd>
                </div>
                <div>
                  <dt>{{ t('例子') }}</dt>
                  <dd lang="ja">{{ t(rule.example) }}</dd>
                </div>
              </dl>
              <template v-else>
                <p>{{ t(rule.rule) }}</p>
                <div class="guide-example" lang="ja">{{ t(rule.example) }}</div>
              </template>
            </template>
            <div v-if="rule.connections" class="grammar-connections">
              <p class="connection-label">{{ t('对应关系') }}</p>
              <ul>
                <li v-for="connection in rule.connections" :key="connection">
                  {{ t(connection) }}
                </li>
              </ul>
              <p v-if="rule.caveat" class="connection-caveat">{{ t(rule.caveat) }}</p>
            </div>
            <SpecialVerbsSheet
              v-if="rule.specialWords || rule.wordExamples"
              :kind="rule.wordExamples"
            />
          </section>
        </div>
      </section>
      <p class="guide-note">{{ t(topic.note) }}</p>
    </article>
    <nav class="guide-chapters" :aria-label="t('章节导航')">
      <button
        v-if="topicIndex > 0"
        type="button"
        class="text-button"
        @click="selectTopic(grammarTopics[topicIndex - 1].id)"
      >
        ← {{ t(grammarTopics[topicIndex - 1].title) }}
      </button>
      <button
        v-if="topicIndex < grammarTopics.length - 1"
        type="button"
        class="text-button next-chapter"
        @click="selectTopic(grammarTopics[topicIndex + 1].id)"
      >
        {{ t('下一章：') }}{{ t(grammarTopics[topicIndex + 1].title) }} →
      </button>
    </nav>
    <details class="guide-sources">
      <summary>{{ t('参考资料') }}</summary>
      <p>{{ t('规则与例子按学习需要整理。可继续阅读：') }}</p>
      <a
        v-if="topic.id === 'comparison'"
        href="https://www.jpf.go.jp/j/project/japanese/teach/tsushin/grammar/backnumber.html"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('国际交流基金 · 面向日语学习者的文法讲解') }}</a
      >
      <a
        v-if="topic.id === 'comparison'"
        href="https://www.mext.go.jp/a_menu/nihongo_kyoiku/kyoiku/seikatsusha/h19_taishoku_shokuin/pdf/hokoku.pdf"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('文部科学省 · 日语教育资料（形容词术语）') }}</a
      >
      <a
        href="https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/card/039.html"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('东京外国语大学 · 动词的三种类型') }}</a
      >
      <a
        href="https://www.coelang.tufs.ac.jp/mt/ja/gmod/courses/c02/lesson21/step1/explanation/038.html"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('东京外国语大学 · 普通形体系') }}</a
      >
      <a
        href="https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/explanation/040.html"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('东京外国语大学 · 形容词普通形') }}</a
      >
      <a
        href="https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf"
        target="_blank"
        rel="noopener noreferrer"
        >{{ t('国际交流基金 · IRODORI 文法笔记') }}</a
      >
    </details>
  </section>
</template>
