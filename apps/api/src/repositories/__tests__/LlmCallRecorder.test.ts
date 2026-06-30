import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { ISessionRepository } from '../../interfaces';
import { LlmCallRecorder } from '../LlmCallRecorder';

describe('LlmCallRecorder', () => {
  let repo: DeepMockProxy<ISessionRepository>;
  let recorder: LlmCallRecorder;

  beforeEach(() => {
    repo = mockDeep<ISessionRepository>();
    recorder = new LlmCallRecorder(repo);
  });

  afterEach(() => {
    mockReset(repo);
  });

  it('converts USD cost to nano-dollars and delegates to the repository', async () => {
    await recorder.record({
      sessionId: 'session-1',
      purpose: 'character',
      model: 'deepseek/deepseek-v4-pro',
      promptTokens: 1200,
      completionTokens: 80,
      totalTokens: 1280,
      costUsd: 0.0001,
      latencyMs: 540,
    });

    expect(repo.recordLlmCall).toHaveBeenCalledWith({
      sessionId: 'session-1',
      purpose: 'character',
      model: 'deepseek/deepseek-v4-pro',
      promptTokens: 1200,
      completionTokens: 80,
      totalTokens: 1280,
      costUsdNanos: 100_000n,
      latencyMs: 540,
    });
  });

  it('converts a zero-cost call without error', async () => {
    await recorder.record({
      sessionId: 'session-1',
      purpose: 'intent',
      model: 'google/gemini-2.5-flash-lite',
      promptTokens: 10,
      completionTokens: 0,
      totalTokens: 10,
      costUsd: 0,
    });

    expect(repo.recordLlmCall).toHaveBeenCalledWith(
      expect.objectContaining({ costUsdNanos: 0n })
    );
  });

  it('forwards an omitted latency as undefined', async () => {
    await recorder.record({
      sessionId: 'session-1',
      purpose: 'object',
      model: 'deepseek/deepseek-v4-flash',
      promptTokens: 50,
      completionTokens: 5,
      totalTokens: 55,
      costUsd: 0.00000495,
    });

    expect(repo.recordLlmCall).toHaveBeenCalledWith(
      expect.objectContaining({ latencyMs: undefined })
    );
  });

  it('forwards audio seconds for a whisper call', async () => {
    await recorder.record({
      sessionId: 'session-1',
      purpose: 'audio',
      model: 'openai/whisper-1',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0.0001,
      audioSeconds: 6,
    });

    expect(repo.recordLlmCall).toHaveBeenCalledWith({
      sessionId: 'session-1',
      purpose: 'audio',
      model: 'openai/whisper-1',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsdNanos: 100_000n,
      latencyMs: undefined,
      audioSeconds: 6,
    });
  });
});
