import { ref } from 'vue';
import samples from './pronunciation-samples.json';
import audioSources from './pronunciation-audio.json';

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
  if (!sample) return;
  stopPronunciation();
  playbackError.value = '';
  const audio = new Audio(audioSources[sample.id as keyof typeof audioSources]);
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
