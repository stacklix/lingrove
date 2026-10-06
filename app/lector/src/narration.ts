import { ref } from 'vue';
import { tts, type TTSPlayback } from '@lingrove/host-sdk';

export function useNarration(
  sentences: () => string[],
  language: () => string | undefined,
  player = tts,
  voice: () => string | undefined = () => undefined,
) {
  const position = ref(0);
  const state = ref('idle');
  const error = ref('');
  const speakingSentence = ref<number | null>(null);
  let generation = 0;
  let paused = false;
  let resumeWaiting: (() => void) | undefined;
  const requestedSentence = ref<number | null>(null);
  let playback: TTSPlayback | undefined;
  const stop = () => {
    generation++;
    const old = playback;
    playback = undefined;
    state.value = 'idle';
    speakingSentence.value = null;
    requestedSentence.value = null;
    paused = false;
    resumeWaiting?.();
    resumeWaiting = undefined;
    void old?.stop().catch(() => {});
  };
  const playFrom = async (percent: number, exactSentence?: number) => {
    stop();
    const ticket = generation;
    error.value = '';
    const texts = sentences();
    const spokenLanguage = language();
    const total = texts.reduce((n, text) => n + text.length, 0);
    const target = (Math.max(0, Math.min(100, percent)) / 100) * total;
    let offset = 0;
    let index =
      exactSentence ??
      texts.findIndex((text) => {
        offset += text.length;
        return offset > target;
      });
    if (index < 0) {
      position.value = 100;
      state.value = 'ended';
      return;
    }
    requestedSentence.value = index;
    offset =
      exactSentence === undefined
        ? offset - texts[index].length
        : texts.slice(0, index).reduce((n, text) => n + text.length, 0);
    try {
      const chunks: { text: string; sentence: number; offset: number }[] = [];
      for (let i = index; i < texts.length; i++) {
        const points = Array.from(texts[i]);
        while (points.length) {
          const text = points.splice(0, 1900).join('');
          if (text.trim()) chunks.push({ text, sentence: i, offset });
          offset += text.length;
        }
      }
      for (let i = 0; i < chunks.length; i++) {
        const { text: chunk, sentence: sentenceIndex, offset: chunkOffset } = chunks[i];
        if (paused && ticket === generation)
          await new Promise<void>((resolve) => {
            resumeWaiting = resolve;
          });
        if (ticket !== generation) return;
        requestedSentence.value = sentenceIndex;
        position.value = total ? (chunkOffset / total) * 100 : 0;
        if (chunk.trim()) {
          state.value = 'buffering';
          playback = player.play(
            { text: chunk, language: spokenLanguage, ...(voice() ? { voice: voice() } : {}) },
            {
              nextText: chunks[i + 1]?.text,
              onState: (value) => {
                if (ticket !== generation || value === 'ended') return;
                state.value = paused && ['playing', 'buffering'].includes(value) ? 'paused' : value;
                if (value === 'playing') speakingSentence.value = sentenceIndex;
              },
            },
          );
          await playback.finished;
        }
      }
      if (ticket === generation) {
        playback = undefined;
        position.value = 100;
        state.value = 'ended';
        speakingSentence.value = null;
        requestedSentence.value = null;
      }
    } catch (e) {
      if (ticket !== generation) return;
      playback = undefined;
      state.value = 'idle';
      speakingSentence.value = null;
      if (!(e instanceof Error && e.name === 'AbortError'))
        error.value = e instanceof Error ? e.message : String(e);
    }
  };
  const seek = (percent: number) => playFrom(percent);
  const seekSentence = (index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= sentences().length)
      return Promise.resolve();
    return playFrom(0, index);
  };
  const pause = async () => {
    if (!['playing', 'buffering'].includes(state.value)) return;
    const ticket = generation;
    paused = true;
    state.value = 'paused';
    try {
      await playback?.pause();
    } catch (e) {
      if (ticket === generation) {
        stop();
        error.value = e instanceof Error ? e.message : String(e);
      }
    }
  };
  const resume = async () => {
    if (!paused) return;
    const ticket = generation;
    paused = false;
    state.value = 'buffering';
    resumeWaiting?.();
    resumeWaiting = undefined;
    try {
      await playback?.resume();
    } catch (e) {
      if (ticket === generation) {
        stop();
        error.value = e instanceof Error ? e.message : String(e);
      }
    }
  };
  const toggle = async () => {
    if (state.value === 'paused') await resume();
    else if (state.value === 'playing' || state.value === 'buffering') await pause();
    else await seek(position.value >= 100 ? 0 : position.value);
  };
  return {
    position,
    state,
    error,
    speakingSentence,
    requestedSentence,
    seek,
    seekSentence,
    pause,
    resume,
    stop,
    toggle,
  };
}
