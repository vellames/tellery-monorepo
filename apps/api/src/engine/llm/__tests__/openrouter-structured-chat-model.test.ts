jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn(),
}));

import { ChatOpenAI } from '@langchain/openai';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { z } from 'zod';
import { OpenRouterStructuredChatModel } from '../openrouter-structured-chat-model';
import { ILlmCallRecorder } from '../../../interfaces';

const fakeAiMessage = (overrides: Record<string, unknown> = {}) => ({
  content: 'a reply',
  usage_metadata: {
    input_tokens: 1200,
    output_tokens: 80,
    total_tokens: 1280,
  },
  response_metadata: {
    model: 'deepseek/deepseek-v4-pro',
    usage: {
      prompt_tokens: 1200,
      completion_tokens: 80,
      total_tokens: 1280,
      cost: 0.0001,
    },
  },
  ...overrides,
});

describe('OpenRouterStructuredChatModel', () => {
  let recorder: DeepMockProxy<ILlmCallRecorder>;
  let chatInstance: { invoke: jest.Mock; withStructuredOutput: jest.Mock };

  beforeEach(() => {
    recorder = mockDeep<ILlmCallRecorder>();
    recorder.record.mockResolvedValue(undefined);
    chatInstance = { invoke: jest.fn(), withStructuredOutput: jest.fn() };
    (ChatOpenAI as unknown as jest.Mock).mockImplementation(() => chatInstance);
  });

  describe('invoke', () => {
    it('records usage as fire-and-forget nanos when a sessionId is provided', async () => {
      chatInstance.invoke.mockResolvedValue(fakeAiMessage());

      const model = new OpenRouterStructuredChatModel(
        'deepseek/deepseek-v4-pro',
        'character',
        recorder
      );

      const result = await model.invoke([{ role: 'user', content: 'hi' }], {
        sessionId: 'session-1',
      });

      expect(result).toBe('a reply');
      // flush microtasks so the fire-and-forget record promise resolves
      await Promise.resolve();
      await Promise.resolve();
      expect(recorder.record).toHaveBeenCalledWith({
        sessionId: 'session-1',
        purpose: 'character',
        model: 'deepseek/deepseek-v4-pro',
        promptTokens: 1200,
        completionTokens: 80,
        totalTokens: 1280,
        costUsd: 0.0001,
        latencyMs: expect.any(Number),
      });
    });

    it('still resolves when the recorder rejects (truly fire-and-forget)', async () => {
      chatInstance.invoke.mockResolvedValue(fakeAiMessage());
      recorder.record.mockRejectedValue(new Error('db down'));

      const model = new OpenRouterStructuredChatModel(
        'deepseek/deepseek-v4-pro',
        'character',
        recorder
      );

      await expect(
        model.invoke([{ role: 'user', content: 'hi' }], {
          sessionId: 'session-1',
        })
      ).resolves.toBe('a reply');
    });

    it('does not record when no sessionId is provided', async () => {
      chatInstance.invoke.mockResolvedValue(fakeAiMessage());

      const model = new OpenRouterStructuredChatModel(
        'deepseek/deepseek-v4-pro',
        'character',
        recorder
      );

      await model.invoke([{ role: 'user', content: 'hi' }]);

      await Promise.resolve();
      expect(recorder.record).not.toHaveBeenCalled();
    });

    it('falls back to the local price table when OpenRouter omits cost', async () => {
      chatInstance.invoke.mockResolvedValue(
        fakeAiMessage({
          response_metadata: { model: 'deepseek/deepseek-v4-flash' },
        })
      );

      const model = new OpenRouterStructuredChatModel(
        'deepseek/deepseek-v4-flash',
        'object',
        recorder
      );

      await model.invoke([{ role: 'user', content: 'hi' }], {
        sessionId: 'session-2',
      });

      await Promise.resolve();
      await Promise.resolve();

      // flash: $0.09/1M prompt, $0.18/1M completion
      // 1200 * 0.09/1e6 + 80 * 0.18/1e6 = 0.000108 + 0.0000144 = 0.0001224
      expect(recorder.record).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'deepseek/deepseek-v4-flash',
          costUsd: expect.closeTo(0.0001224, 12),
        })
      );
    });
  });

  describe('invokeStructured', () => {
    it('records usage from the raw message alongside the parsed result', async () => {
      const schema = z.object({ ok: z.boolean() });
      const rawRunnable = { invoke: jest.fn() };
      chatInstance.withStructuredOutput.mockReturnValue(rawRunnable);
      rawRunnable.invoke.mockResolvedValue({
        raw: fakeAiMessage(),
        parsed: { ok: true },
      });

      const model = new OpenRouterStructuredChatModel(
        'deepseek/deepseek-v4-pro',
        'intent',
        recorder
      );

      const result = await model.invokeStructured(
        [{ role: 'user', content: 'hi' }],
        schema,
        { sessionId: 'session-3' }
      );

      expect(result).toEqual({ ok: true });
      await Promise.resolve();
      await Promise.resolve();
      expect(recorder.record).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-3',
          purpose: 'intent',
          costUsd: 0.0001,
        })
      );
    });
  });
});
