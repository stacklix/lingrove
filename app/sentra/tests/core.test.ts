import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defaults, validateResult } from '../src/models';
import { analyze } from '../src/api';
import { SSEParser } from '../../../packages/host-sdk/src/llm';
import { partialResult } from '../src/partial';
import { getAppLanguage, request, moduleStorage } from '@lingrove/host-sdk';
const storage = moduleStorage('sentra');
const valid = {
  source_language: '中文',
  translation_language: '英语',
  translations: [
    { text: 'Hello', type: 'direct' },
    { text: 'Hi', type: 'natural' },
  ],
  notes: ['Note'],
};
beforeEach(() => {
  localStorage.clear();
  delete window.webkit;
  vi.unstubAllGlobals();
});
describe('provider contracts', () => {
  it('requires translation direction and both variants', () => {
    expect(validateResult('translate', JSON.stringify(valid), '你好', '英语')).toEqual(valid);
    expect(() =>
      validateResult(
        'translate',
        JSON.stringify({ ...valid, translation_language: '日语' }),
        '你好',
        '英语',
      ),
    ).toThrow();
    expect(() =>
      validateResult('translate', JSON.stringify({ ...valid, translations: [] }), '你好', '英语'),
    ).toThrow();
  });
  it('rejects analysis of a rewritten sentence and contradictory corrections', () => {
    const grammar = {
      source_language: 'en',
      analysis_text: 'He go.',
      analysis_origin: 'original',
      correct: false,
      summary: 'agreement',
      corrections: [{ original: 'go', corrected: 'goes', explanation: 'agreement' }],
      structure: [{ text: 'He', translation: '他', part: 'pronoun', role: 'subject' }],
      grammar_points: [],
    };
    expect(validateResult('grammar', JSON.stringify(grammar), 'He go.', '英语')).toEqual(grammar);
    expect(() =>
      validateResult('grammar', JSON.stringify({ ...grammar, correct: true }), 'He go.', '英语'),
    ).toThrow();
    expect(() => validateResult('grammar', JSON.stringify(grammar), 'He goes.', '英语')).toThrow();
  });
});
describe('streaming', () => {
  it('handles arbitrary boundaries, CRLF, comments and multiline data', () => {
    const values: string[] = [];
    const parser = new SSEParser((x) => values.push(x));
    for (const char of ':ping\r\ndata: one\r\ndata: two\r\n\r\ndata: [DONE]') parser.feed(char);
    parser.finish();
    expect(values).toEqual(['one\ntwo', '[DONE]']);
  });
  it('renders incomplete JSON without saving it', () => {
    expect(partialResult('{"translations":[{"text":"Hello')).toEqual({
      translations: [{ text: 'Hello' }],
    });
  });
  it('consumes streamed OpenAI chunks and rejects interrupted responses', async () => {
    const body = JSON.stringify(valid);
    let complete = true;
    window.webkit = {
      messageHandlers: {
        lingrove: {
          postMessage: vi.fn(async (message: any) => {
            if (message.method === 'runtime.language') return 'zh-Hans';
            window.__lingroveChunk?.(
              message.params.id,
              `data: ${JSON.stringify({ choices: [{ delta: { content: body } }] })}\n\n${complete ? 'data: [DONE]\n\n' : ''}`,
            );
            return {
              status: 200,
              headers: { 'content-type': 'text/event-stream' },
              body: '',
              model: 'host-model',
              protocol: 'openAi',
            };
          }),
        },
      },
    };
    const config = { ...defaults };
    const progress = vi.fn();
    const result = await analyze(
      'translate',
      '你好',
      config,
      new AbortController().signal,
      progress,
    );
    expect(result.data).toEqual(valid);
    expect(progress).toHaveBeenCalledWith(body);
    complete = false;
    await expect(
      analyze('translate', '你好', config, new AbortController().signal, progress),
    ).rejects.toThrow('连接中断');
  });
  it('accepts Anthropic and non-streaming compatible responses', async () => {
    const content = JSON.stringify(valid);
    window.webkit = {
      messageHandlers: {
        lingrove: {
          postMessage: vi.fn(async (message: any) =>
            message.method === 'runtime.language'
              ? 'zh-Hans'
              : {
                  status: 200,
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    content: [{ type: 'text', text: content }],
                    stop_reason: 'end_turn',
                  }),
                  model: 'host-model',
                  protocol: 'anthropic',
                },
          ),
        },
      },
    };
    expect(
      (await analyze('translate', '你好', { ...defaults }, new AbortController().signal, () => {}))
        .data,
    ).toEqual(valid);
  });
});
describe('host SDK', () => {
  it('uses the browser language outside the host', async () => {
    vi.stubGlobal('navigator', { language: 'fr-FR' });
    expect(await getAppLanguage()).toBe('en');
  });
  it('routes requests to the native bridge without calling fetch', async () => {
    const postMessage = vi.fn(async () => ({ status: 200, headers: {}, body: 'ok' }));
    window.webkit = { messageHandlers: { lingrove: { postMessage } } };
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect((await request({ url: 'https://first.example/path' })).body).toBe('ok');
    await request({ url: 'https://second.example/path' });
    expect(fetch).not.toHaveBeenCalled();
    expect(postMessage.mock.calls).toHaveLength(2);
  });
  it('aborts without sending pre-cancelled requests', async () => {
    const abort = new AbortController();
    abort.abort();
    await expect(request({ url: 'https://a.example' }, { signal: abort.signal })).rejects.toThrow();
  });
  it('persists browser history and exposes corruption', async () => {
    await storage.set('history', [{ text: 'hello' }]);
    expect(localStorage.getItem('sentra.history')).toContain('hello');
    expect(await storage.get('history')).toEqual([{ text: 'hello' }]);
    localStorage.setItem('sentra.history', 'broken');
    await expect(storage.get('history')).rejects.toThrow();
  });
});

describe('grammar component translations', () => {
  const grammar = {
    source_language: 'en',
    analysis_text: 'Hello',
    analysis_origin: 'original',
    correct: true,
    summary: 'Greeting',
    corrections: [],
    structure: [
      { text: 'Hello', translation: 'こんにちは', part: 'interjection', role: 'greeting' },
    ],
    grammar_points: [],
  };
  it('requires a nonempty translation for each component', () => {
    for (const translation of [undefined, '', '  ', 42]) {
      expect(() =>
        validateResult(
          'grammar',
          JSON.stringify({ ...grammar, structure: [{ ...grammar.structure[0], translation }] }),
          'Hello',
          '英语',
        ),
      ).toThrow('生成结果不完整，请重试。');
    }
  });
  it('reads the current host language on every analysis independently of other language settings', async () => {
    let language = 'ja';
    const systems: string[] = [];
    window.webkit = {
      messageHandlers: {
        lingrove: {
          postMessage: vi.fn(async (message: any) => {
            if (message.method === 'runtime.language') return language;
            systems.push(message.params.system);
            return {
              status: 200,
              headers: {},
              model: 'host-model',
              protocol: 'openAi',
              body: JSON.stringify({
                choices: [{ message: { content: JSON.stringify(grammar) }, finish_reason: 'stop' }],
              }),
            };
          }),
        },
      },
    };
    await analyze('grammar', 'Hello', defaults, new AbortController().signal, () => {});
    language = 'zh-Hant';
    await analyze('grammar', 'Hello', defaults, new AbortController().signal, () => {});
    expect(systems[0]).toContain('COMPONENT_TRANSLATION_LANGUAGE=ja.');
    expect(systems[1]).toContain('COMPONENT_TRANSLATION_LANGUAGE=zh-Hans.');
    expect(systems[0]).toContain('EXPLANATION_LANGUAGE=ja.');
    expect(systems[0]).toContain('TRANSLATION_LANGUAGE=英语.');
  });
});
