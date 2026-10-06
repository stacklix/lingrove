import { createID, invoke, isNative, streams } from './index';

export interface TTSStatus {
  configured: boolean;
  provider: string;
  model: string;
  voice: string;
  voices: { id: string; title: string; language: string }[];
}
export interface TTSRequest {
  /** 1–4000 UTF-16 code units. Split long articles into paragraphs. */
  text: string;
  /** Overrides the host voice for this request only. */
  voice?: string;
  /** 0.5–2. Omit to use the host's default speed. */
  speed?: number;
  /** Spoken text language (BCP 47), e.g. ja, zh-CN, en-US. Not the UI language.
   * Omit, or use an unconfigured language, to use the default voice. */
  language?: string;
}
export interface TTSResult {
  /** MP3 data URL; assign directly to an HTMLAudioElement's src. */
  audioURL: string;
  mimeType: 'audio/mpeg';
  model: string;
  provider: string;
}
export interface TTSOptions {
  signal?: AbortSignal;
}

export type TTSPlaybackState = 'buffering' | 'playing' | 'paused' | 'ended' | 'stopped' | 'error';
export interface TTSPlaybackOptions extends TTSOptions {
  /** Prepare only the next chunk with the same language, voice and speed. */
  nextText?: string;
  onState?: (state: TTSPlaybackState) => void;
}
export interface TTSPlayback {
  /** Resolves after the last sample has played. Stop/abort rejects with AbortError. */
  finished: Promise<{ model: string; provider: string }>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}

function languageParams(language: string | undefined): { language?: string } {
  if (language === undefined) return {};
  if (
    typeof language !== 'string' ||
    language.length > 63 ||
    !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(language)
  )
    throw new Error('请选择有效的朗读语言。');
  return { language };
}

export const tts = {
  /** Starts native incremental playback; no full audio file is returned. */
  play(input: TTSRequest, options: TTSPlaybackOptions = {}): TTSPlayback {
    const id = createID();
    let settled = false;
    let stopped = false;
    let callbackError: unknown;
    const control = async (action: 'pause' | 'resume' | 'stop') => {
      if (settled) return;
      if (action === 'stop') stopped = true;
      await invoke(`tts.${action}`, { id });
    };
    const abort = () => {
      void control('stop').catch(() => {});
    };
    streams.set(id, (chunk) => {
      if (settled || callbackError) return;
      try {
        const event = JSON.parse(chunk) as { state: TTSPlaybackState };
        if (event.state === 'stopped') stopped = true;
        options.onState?.(event.state);
      } catch (error) {
        callbackError = error;
        abort();
      }
    });
    options.signal?.addEventListener('abort', abort, { once: true });
    const finished = (async () => {
      try {
        if (options.signal?.aborted) throw new DOMException('已取消', 'AbortError');
        if (!isNative()) throw new Error('请在 Lingrove 中使用朗读功能。');
        if (!input.text.trim() || input.text.length > 4000)
          throw new Error('朗读文本须为 1–4000 个字符，请将长文章分段生成');
        if (
          input.speed !== undefined &&
          (!Number.isFinite(input.speed) || input.speed < 0.5 || input.speed > 2)
        )
          throw new Error('语速须为 0.5–2 倍');
        const result = await invoke<{ model: string; provider: string }>('tts.play', {
          id,
          text: input.text,
          ...(input.voice === undefined ? {} : { voice: input.voice }),
          ...languageParams(input.language),
          ...(options.nextText === undefined ? {} : { nextText: options.nextText }),
          ...(input.speed === undefined ? {} : { speed: input.speed }),
        });
        if (callbackError) throw callbackError;
        if (stopped || options.signal?.aborted) throw new DOMException('已取消', 'AbortError');
        return result;
      } catch (error) {
        if (callbackError) throw callbackError;
        if (stopped || options.signal?.aborted) throw new DOMException('已取消', 'AbortError');
        throw error;
      } finally {
        settled = true;
        streams.delete(id);
        options.signal?.removeEventListener('abort', abort);
      }
    })();
    return {
      finished,
      pause: () => control('pause'),
      resume: () => control('resume'),
      stop: () => control('stop'),
    };
  },
  async status(): Promise<TTSStatus> {
    if (!isNative()) return { configured: false, provider: '', model: '', voice: '', voices: [] };
    return invoke('tts.status', {});
  },
  async synthesize(input: TTSRequest, options: TTSOptions = {}): Promise<TTSResult> {
    const aborted = () => new DOMException('已取消', 'AbortError');
    if (options.signal?.aborted) throw aborted();
    if (!isNative()) throw new Error('请在 Lingrove 中使用朗读功能。');
    if (!input.text.trim() || input.text.length > 4000)
      throw new Error('朗读文本须为 1–4000 个字符，请将长文章分段生成');
    if (
      input.speed !== undefined &&
      (!Number.isFinite(input.speed) || input.speed < 0.5 || input.speed > 2)
    )
      throw new Error('语速须为 0.5–2 倍');
    const id = createID();
    const cancel = () => {
      void invoke('tts.cancel', { id }).catch(() => {});
    };
    options.signal?.addEventListener('abort', cancel, { once: true });
    try {
      const result = await invoke<{
        audioBase64: string;
        mimeType: 'audio/mpeg';
        model: string;
        provider: string;
      }>('tts.synthesize', {
        id,
        text: input.text,
        ...(input.voice === undefined ? {} : { voice: input.voice }),
        ...languageParams(input.language),
        ...(input.speed === undefined ? {} : { speed: input.speed }),
      });
      if (options.signal?.aborted) throw aborted();
      return {
        audioURL: `data:${result.mimeType};base64,${result.audioBase64}`,
        mimeType: result.mimeType,
        model: result.model,
        provider: result.provider,
      };
    } catch (error) {
      if (options.signal?.aborted) throw aborted();
      throw error;
    } finally {
      options.signal?.removeEventListener('abort', cancel);
    }
  },
};
