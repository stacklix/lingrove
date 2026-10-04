import { invoke, isNative, createID, streams } from './index';
import type { HTTPResponse } from './index';

export interface LLMRequest {
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
}
export interface LLMResult {
  text: string;
  model: string;
}
export interface LLMOptions {
  signal?: AbortSignal;
  onProgress?: (text: string) => void;
}

export class SSEParser {
  private buffer = '';
  private data: string[] = [];
  constructor(private receive: (data: string) => void) {}
  feed(chunk: string) {
    this.buffer += chunk;
    let end: number;
    while ((end = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, end).replace(/\r$/, '');
      this.buffer = this.buffer.slice(end + 1);
      if (!line) this.dispatch();
      else if (line.startsWith('data:')) this.data.push(line.slice(5).replace(/^ /, ''));
    }
  }
  finish() {
    if (this.buffer) this.feed('\n');
    this.dispatch();
  }
  private dispatch() {
    if (this.data.length) {
      const payload = this.data.join('\n');
      this.data = [];
      this.receive(payload);
    }
  }
}
export const llm = {
  async status(): Promise<{ configured: boolean; model: string }> {
    if (!isNative()) return { configured: false, model: '' };
    return invoke('llm.status', {});
  },
  async complete(input: LLMRequest, options: LLMOptions = {}): Promise<LLMResult> {
    if (options.signal?.aborted) throw new DOMException('已取消', 'AbortError');
    if (!isNative()) throw new Error('请在 Lingrove 宿主中使用模型服务；浏览器仅支持界面预览');
    let content = '';
    let completed = false;
    let streamError: unknown;
    const checkReason = (reason: string) => {
      if (['length', 'max_tokens', 'refusal', 'content_filter'].includes(reason))
        throw new Error('模型输出被截断或拒绝，请缩短输入后重试');
    };
    const parser = new SSEParser((payload) => {
      if (payload === '[DONE]') {
        completed = true;
        return;
      }
      const event = JSON.parse(payload);
      if (event.error || event.type === 'error') throw new Error('模型服务返回流式错误');
      const reason = event.delta?.stop_reason ?? event.choices?.[0]?.finish_reason;
      checkReason(reason);
      let delta = event.choices?.[0]?.delta?.content ?? '';
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta')
        delta = event.delta.text;
      if (event.type === 'content_block_start' && event.content_block?.type === 'text')
        delta = event.content_block.text;
      if (event.type === 'message_stop' || event.choices?.[0]?.finish_reason) completed = true;
      if (typeof delta !== 'string') throw new Error('模型响应格式无效');
      content += delta;
      if (delta) options.onProgress?.(content);
    });
    const id = createID();
    const cancel = () => {
      void invoke('llm.cancel', { id }).catch(() => {});
    };
    streams.set(id, (chunk) => {
      if (streamError || options.signal?.aborted) return;
      try {
        parser.feed(chunk);
      } catch (error) {
        streamError = error;
        cancel();
      }
    });
    options.signal?.addEventListener('abort', cancel, { once: true });
    try {
      const response = await invoke<HTTPResponse & { model: string; protocol: string }>(
        'llm.request',
        {
          id,
          system: input.system ?? '',
          messages: input.messages,
          maxTokens: input.maxTokens ?? 4096,
        },
      );
      if (options.signal?.aborted) throw new DOMException('已取消', 'AbortError');
      if (streamError) throw streamError;
      if (response.status < 200 || response.status >= 300)
        throw new Error(`请求失败（HTTP ${response.status}），请检查宿主中的模型配置`);
      if (response.headers['content-type']?.includes('text/event-stream')) {
        parser.finish();
        if (!completed) throw new Error('连接中断，结果未完成，请重试');
      } else {
        const envelope = JSON.parse(response.body);
        if (envelope.error) throw new Error('模型服务返回错误');
        const anthropic = response.protocol === 'anthropic';
        checkReason(anthropic ? envelope.stop_reason : envelope.choices?.[0]?.finish_reason);
        content = anthropic
          ? envelope.content
              ?.filter((b: any) => b.type === 'text')
              .map((b: any) => b.text)
              .join('')
          : envelope.choices?.[0]?.message?.content;
        if (typeof content !== 'string') throw new Error('模型响应格式无效');
        options.onProgress?.(content);
      }
      return { text: content, model: response.model };
    } catch (error) {
      if (options.signal?.aborted) throw new DOMException('已取消', 'AbortError');
      throw streamError ?? error;
    } finally {
      streams.delete(id);
      options.signal?.removeEventListener('abort', cancel);
    }
  },
};
