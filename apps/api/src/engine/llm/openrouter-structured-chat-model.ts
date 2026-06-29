import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { appConfig } from '../../config/app.config';
import { ILlmCallRecorder } from '../../interfaces';
import {
  ChatInvokeContext,
  ChatMessage,
  IStructuredChatModel,
} from './structured-chat-model.interface';
import { computeCostUsd } from './cost';

interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
}

interface LangChainMessageResult {
  content: unknown;
  usage_metadata?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  response_metadata?: {
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      cost?: number;
    };
  };
}

export class OpenRouterStructuredChatModel implements IStructuredChatModel {
  private readonly chatModel: ChatOpenAI;

  constructor(
    private readonly model: string,
    private readonly purpose: 'intent' | 'character' | 'object',
    private readonly recorder: ILlmCallRecorder,
    reasoningEffort?: string
  ) {
    this.chatModel = new ChatOpenAI({
      apiKey: appConfig.openrouter.apiKey,
      model,
      configuration: {
        baseURL: appConfig.openrouter.baseUrl,
      },
      ...(reasoningEffort
        ? { modelKwargs: { reasoning_effort: reasoningEffort } }
        : {}),
    });
  }

  async invoke(
    messages: ChatMessage[],
    context?: ChatInvokeContext
  ): Promise<string> {
    console.log('[llm] plain call', {
      model: this.model,
      messageCount: messages.length,
    });

    const startedAt = Date.now();
    const result = await this.chatModel.invoke(
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      }))
    );
    const latencyMs = Date.now() - startedAt;

    this.recordUsage(
      result as unknown as LangChainMessageResult,
      context,
      latencyMs
    );

    return typeof result.content === 'string'
      ? result.content
      : String(result.content);
  }

  async invokeStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodType<T>,
    context?: ChatInvokeContext
  ): Promise<T> {
    console.log('[llm] structured call', {
      model: this.model,
      messageCount: messages.length,
    });

    const startedAt = Date.now();
    const structured = this.chatModel.withStructuredOutput(schema, {
      includeRaw: true,
    });
    const response = (await structured.invoke(
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      }))
    )) as { raw?: LangChainMessageResult; parsed: T };
    const latencyMs = Date.now() - startedAt;

    if (response.raw) {
      this.recordUsage(response.raw, context, latencyMs);
    }

    return response.parsed;
  }

  private recordUsage(
    result: LangChainMessageResult,
    context: ChatInvokeContext | undefined,
    latencyMs: number
  ): void {
    const sessionId = context?.sessionId;
    if (!sessionId) return;

    const usage = this.extractUsage(result);

    this.recorder
      .record({
        sessionId,
        purpose: this.purpose,
        model: this.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        costUsd: usage.costUsd,
        latencyMs,
      })
      .catch((error) => {
        console.error('[llm] failed to record usage', error);
      });
  }

  private extractUsage(result: LangChainMessageResult): LlmUsage {
    const metadata = result.usage_metadata;
    const responseUsage = result.response_metadata?.usage;

    const promptTokens =
      metadata?.input_tokens ?? responseUsage?.prompt_tokens ?? 0;
    const completionTokens =
      metadata?.output_tokens ?? responseUsage?.completion_tokens ?? 0;
    const totalTokens =
      metadata?.total_tokens ??
      responseUsage?.total_tokens ??
      promptTokens + completionTokens;

    const costUsd =
      typeof responseUsage?.cost === 'number'
        ? responseUsage.cost
        : computeCostUsd(
            this.model,
            promptTokens,
            completionTokens,
            appConfig.openrouter.pricing
          );

    return { promptTokens, completionTokens, totalTokens, costUsd };
  }
}
