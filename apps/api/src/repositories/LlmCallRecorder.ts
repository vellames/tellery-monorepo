import { ILlmCallRecorder, LlmCallUsageInput } from '../interfaces';
import { ISessionRepository } from '../interfaces';
import { toNanos } from '../engine/llm/cost';

export class LlmCallRecorder implements ILlmCallRecorder {
  constructor(private readonly sessions: ISessionRepository) {}

  async record(input: LlmCallUsageInput): Promise<void> {
    await this.sessions.recordLlmCall({
      sessionId: input.sessionId,
      purpose: input.purpose,
      model: input.model,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      totalTokens: input.totalTokens,
      costUsdNanos: toNanos(input.costUsd),
      latencyMs: input.latencyMs,
      audioSeconds: input.audioSeconds,
    });
  }
}
