<script setup lang="ts">
import { computed, onDeactivated, onBeforeUnmount, ref } from 'vue';
import { setRootPage } from '@lingrove/host-sdk';
import { specialVerbGroups } from '../special-verbs';
import { irregularVerbLists, type VerbExampleGroup } from '../irregular-verbs';
const props = defineProps<{ kind?: 'sahen' | 'kahen' }>();
const list = computed(() => (props.kind ? irregularVerbLists[props.kind] : undefined));
const sheetId = computed(() => (props.kind ? `verb-examples-${props.kind}` : 'special-verbs'));
const title = computed(() => list.value?.title ?? '容易误判的五段动词');
const dialog = ref<HTMLDialogElement>();
const query = ref('');
const isOpen = ref(false);
let previousOverflow = '';
let trigger: HTMLElement | null = null;
const groups = computed(() => {
  const term = query.value.trim();
  const source: VerbExampleGroup[] = list.value?.groups ?? specialVerbGroups;
  return source
    .map((group) => ({
      ...group,
      words: group.words.filter(
        (word) =>
          word.word.includes(term) || word.reading.includes(term) || word.meaning?.includes(term),
      ),
    }))
    .filter((group) => group.words.length);
});
function restore() {
  if (!isOpen.value) return;
  isOpen.value = false;
  document.body.style.overflow = previousOverflow;
  void setRootPage(true).catch(() => {});
  trigger?.focus({ preventScroll: true });
}
function close() {
  if (!isOpen.value) return;
  dialog.value?.close();
  restore();
}
function open(event: Event) {
  if (!dialog.value || isOpen.value) return;
  trigger = event.currentTarget as HTMLElement;
  query.value = '';
  previousOverflow = document.body.style.overflow;
  dialog.value.showModal();
  dialog.value.scrollTop = 0;
  isOpen.value = true;
  document.body.style.overflow = 'hidden';
  void setRootPage(false).catch(() => {});
}
onDeactivated(close);
onBeforeUnmount(close);
</script>
<template>
  <button
    class="text-button special-verbs-toggle"
    type="button"
    aria-haspopup="dialog"
    :aria-controls="sheetId"
    :aria-expanded="isOpen"
    @click="open"
  >
    {{ list ? `查看${list.title} ↗` : '查看特殊词表 ↗' }}
  </button>
  <dialog
    :id="sheetId"
    ref="dialog"
    class="special-verbs-sheet"
    :aria-labelledby="`${sheetId}-title`"
    @cancel.prevent="close"
    @close="restore"
    @click="$event.target === dialog && close()"
  >
    <div class="special-verbs-inner">
      <header class="special-verbs-header">
        <div class="directory-heading">
          <h2 :id="`${sheetId}-title`">{{ title }}</h2>
          <button
            type="button"
            class="directory-close"
            :aria-label="list ? `关闭${title}` : '关闭特殊词表'"
            autofocus
            @click="close"
          >
            ×
          </button>
        </div>
        <label class="special-verbs-search"
          >查找词语
          <input
            v-model="query"
            type="search"
            :placeholder="list ? '输入汉字、假名或中文释义' : '输入汉字或假名'"
          />
        </label>
      </header>
      <p v-for="note in list?.notes" :key="note" class="special-verbs-scope">{{ note }}</p>
      <p v-if="!list" class="special-verbs-scope">
        这些词虽然以「い段／え段＋る」结尾，仍按五段活用，如：帰る → 帰らない・帰ります。
      </p>
      <p v-if="!list" class="special-verbs-scope">
        主词表完整列出参考资料收录的 66
        条，另附补充词与复合词示例；并非日语全部此类词。异写分别列出，类型以所列读音为准。
      </p>
      <section
        v-for="group in groups"
        :key="group.title"
        class="special-verbs-group"
        :class="{ 'verb-examples-group': list }"
      >
        <h3>
          {{ group.title }} <span>{{ group.words.length }}</span>
        </h3>
        <p>{{ group.note }}</p>
        <ul>
          <li v-for="word in group.words" :key="`${word.word}-${word.reading}`" lang="ja">
            <strong>{{ word.word }}</strong
            ><span>{{ word.reading }}</span>
            <span v-if="word.meaning" class="verb-example-meaning" lang="zh">{{
              word.meaning
            }}</span>
            <span v-if="word.example" class="verb-example-conjugation">{{ word.example }}</span>
          </li>
        </ul>
      </section>
      <p v-if="!groups.length" role="status">未找到匹配词语，试试其他汉字或假名。</p>
      <footer v-if="!list" class="special-verbs-sources">
        词表来源：<a
          href="https://mainichi-nonbiri.com/qa/qa155/"
          target="_blank"
          rel="noopener noreferrer"
          >毎日のんびり日本語教師（66 条）</a
        >
        ·
        <a
          href="https://blog.shodo.ink/entry/2021/09/05/013031"
          target="_blank"
          rel="noopener noreferrer"
          >Shodo（补充词）</a
        >
      </footer>
    </div>
  </dialog>
</template>
