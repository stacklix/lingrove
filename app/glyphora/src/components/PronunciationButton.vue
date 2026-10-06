<script setup lang="ts">
import { useAppI18n } from '@lingrove/host-sdk/vue';
const { t } = useAppI18n();
import { computed, onBeforeUnmount } from 'vue';
import type { Glyph } from '../curriculum';
import {
  pronunciationFor,
  speaking,
  playbackError,
  playPronunciation,
  stopPronunciation,
} from '../pronunciation';
const props = defineProps<{ glyph: Glyph; compact?: boolean }>();
const sample = computed(() => pronunciationFor(props.glyph.id));
const playing = computed(() => !!sample.value && speaking.value === sample.value.id);
const failed = computed(() => !!sample.value && playbackError.value === sample.value.id);
onBeforeUnmount(() => {
  if (playing.value) stopPronunciation();
});
</script>
<template>
  <div v-if="sample" class="pronunciation-control" :class="{ compact }">
    <button
      type="button"
      class="pronunciation-button"
      :class="{ playing, failed }"
      :aria-label="
        t('{0} {1} 的{2}', [
          t(failed ? '播放失败，重试' : playing ? '正在播放' : '播放'),
          glyph.text,
          t(sample.kind),
        ])
      "
      :aria-busy="playing"
      :title="
        failed
          ? t('播放失败，点击重试')
          : `${playing ? t('正在播放：') : ''}${t(sample.kind)}: ${sample.text}`
      "
      @click.stop="playPronunciation(glyph.id)"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </svg>
    </button>
  </div>
</template>
