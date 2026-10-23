import { ref } from 'vue';
import samples from './pronunciation-samples.json';
// Keep the recordings out of the startup module. Load them after runtime.ready.
let audioSources: Record<string, string> = {};
export const audioState = ref<'loading' | 'ready' | 'failed'>('loading');
let loadingAudio: Promise<void> | null = null;
export function loadPronunciations(): Promise<void> {
  if (audioState.value === 'ready') return Promise.resolve();
  if (loadingAudio) return loadingAudio;
  audioState.value = 'loading';
  loadingAudio = import('./pronunciation-audio.json').then(
    (module) => {
      audioSources = module.default;
      audioState.value = 'ready';
    },
    (error) => {
      loadingAudio = null;
      audioState.value = 'failed';
      throw error;
    },
  );
  return loadingAudio;
}

export const pronunciationFor = (id: string) =>
  samples.find((sample) => sample.glyphs.includes(id));
export const speaking = ref('');
export const playbackError = ref('');
let player: HTMLAudioElement | null = null;

export function stopPronunciation() {
  const previous = player;
  player = null;
  speaking.value = '';
  if (previous) {
    previous.onended = null;
    previous.onerror = null;
    previous.pause();
  }
}

export async function playPronunciation(id: string) {
  const sample = pronunciationFor(id);
  if (!sample || audioState.value !== 'ready') return;
  stopPronunciation();
  playbackError.value = '';
  const audio = new Audio(audioSources[sample.id]);
  player = audio;
  speaking.value = sample.id;
  const failed = () => {
    if (player !== audio) return;
    playbackError.value = sample.id;
    stopPronunciation();
  };
  audio.onended = () => {
    if (player === audio) stopPronunciation();
  };
  audio.onerror = failed;
  try {
    await audio.play();
  } catch {
    failed();
  }
}
