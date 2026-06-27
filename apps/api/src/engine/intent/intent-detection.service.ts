import { SupportedLanguage } from '@ai-history/i18n';
import { z } from 'zod';
import {
  ChatMessage,
  IStructuredChatModel,
} from '../llm/structured-chat-model.interface';

const OFF_TOPIC_INTENT_ID = 'off_topic';
const SYSTEM_PROMPT_KEY = 'intentDetectorSystemPrompt';
const USER_PROMPT_KEY = 'intentDetectorUserPrompt';

export interface IntentDetectionTarget {
  id: string;
  description: string;
  examples: string[];
  keywords: string[];
}

export interface DetectedIntent {
  intentId: string;
  confidence: number;
  reasoning: string;
}

export interface DetectIntentInput {
  message: string;
  intents: IntentDetectionTarget[];
  language: SupportedLanguage;
}

export type IntentTranslationFn = (
  language: SupportedLanguage,
  key: string,
  params?: Record<string, string>
) => string;

const IntentDetectorResponseSchema = z.array(
  z.object({
    intentId: z.string(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
  })
);

type IntentDetectorResponse = z.infer<typeof IntentDetectorResponseSchema>;

export class IntentDetectionService {
  constructor(
    private readonly llm: IStructuredChatModel,
    private readonly threshold: number,
    private readonly translate: IntentTranslationFn
  ) {}

  async detect(input: DetectIntentInput): Promise<DetectedIntent[]> {
    if (input.intents.length === 0) {
      throw new Error('Intent detection requires at least one intent.');
    }

    const threshold = this.normalizeThreshold(this.threshold);
    const validIntentIds = new Set(input.intents.map((intent) => intent.id));
    const fallbackIntentId = validIntentIds.has(OFF_TOPIC_INTENT_ID)
      ? OFF_TOPIC_INTENT_ID
      : input.intents[0].id;

    const response = await this.llm.invokeStructured(
      this.buildMessages(input, threshold),
      IntentDetectorResponseSchema
    );

    console.log('[intent-detection] raw llm response', {
      message: input.message,
      intentCount: input.intents.length,
      threshold,
      response,
    });

    const normalized = this.normalize(
      response,
      validIntentIds,
      fallbackIntentId,
      threshold
    );

    console.log('[intent-detection] normalized', {
      message: input.message,
      normalized,
    });

    return normalized;
  }

  private buildMessages(
    input: DetectIntentInput,
    threshold: number
  ): ChatMessage[] {
    return [
      {
        role: 'system',
        content: this.translate(input.language, SYSTEM_PROMPT_KEY),
      },
      {
        role: 'user',
        content: this.translate(input.language, USER_PROMPT_KEY, {
          message: input.message,
          intents: this.formatIntents(input.intents),
          threshold: threshold.toString(),
        }),
      },
    ];
  }

  private formatIntents(intents: IntentDetectionTarget[]): string {
    return intents
      .map((intent) => {
        const examples = intent.examples.join(' | ');
        const keywords = intent.keywords.join(', ');

        return `- ${intent.id}: ${intent.description}\n  examples: ${examples}\n  keywords: ${keywords}`;
      })
      .join('\n');
  }

  private normalize(
    response: IntentDetectorResponse,
    validIntentIds: Set<string>,
    fallbackIntentId: string,
    threshold: number
  ): DetectedIntent[] {
    const detected = response
      .filter(
        (intent) =>
          validIntentIds.has(intent.intentId) && intent.confidence >= threshold
      )
      .map((intent) => ({
        intentId: intent.intentId,
        confidence: intent.confidence,
        reasoning: intent.reasoning,
      }));

    if (detected.length > 0) return detected;

    return [
      {
        intentId: fallbackIntentId,
        confidence: 0,
        reasoning: 'No intent reached the configured threshold.',
      },
    ];
  }

  private normalizeThreshold(threshold: number): number {
    if (Number.isNaN(threshold)) return 0.5;

    return Math.min(1, Math.max(0, threshold));
  }
}
