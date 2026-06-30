import { LlmCallPurpose } from '@prisma/client';

export interface LlmCallUsageInput {
  sessionId: string;
  purpose: LlmCallPurpose;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs?: number | null;
  audioSeconds?: number | null;
}

export interface ILlmCallRecorder {
  record(input: LlmCallUsageInput): Promise<void>;
}
