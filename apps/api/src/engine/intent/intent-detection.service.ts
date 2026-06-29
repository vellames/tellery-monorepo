import { SupportedLanguage } from '@ai-history/i18n';
import { z } from 'zod';
import {
  ChatMessage,
  IStructuredChatModel,
} from '../llm/structured-chat-model.interface';

const OFF_TOPIC_INTENT_ID = 'off_topic';
const SYSTEM_PROMPT_KEY = 'intentDetectorSystemPrompt';
const USER_PROMPT_KEY = 'intentDetectorUserPrompt';
const KEYWORD_MATCH_REASON = 'Matched by keyword.';
const KEYWORD_MATCH_CONFIDENCE = 1;

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

    // 1. Deterministic keyword matching
    const keywordMatches = this.matchKeywords(input.message, input.intents);
    const keywordIntentIds = new Set(keywordMatches.map((m) => m.intentId));

    console.log('[intent-detection] keyword matches', {
      message: input.message,
      matched: keywordMatches,
    });

    // 2. LLM fallback for intents that keywords didn't catch
    const remainingIntents = input.intents.filter(
      (intent) => !keywordIntentIds.has(intent.id)
    );

    let llmDetected: DetectedIntent[] = [];
    if (remainingIntents.length > 0) {
      const response = await this.llm.invokeStructured(
        this.buildMessages({ ...input, intents: remainingIntents }, threshold),
        IntentDetectorResponseSchema
      );

      console.log('[intent-detection] raw llm response', {
        message: input.message,
        intentCount: remainingIntents.length,
        threshold,
        response,
      });

      llmDetected = this.normalizeLlmResponse(
        response,
        new Set(remainingIntents.map((i) => i.id)),
        threshold
      );
    }

    // 3. Combine: keyword matches (confidence 1.0) + LLM matches
    const combined = [...keywordMatches, ...llmDetected];

    if (combined.length > 0) {
      console.log('[intent-detection] combined', {
        message: input.message,
        combined,
      });
      return combined;
    }

    const fallback: DetectedIntent[] = [
      {
        intentId: fallbackIntentId,
        confidence: 0,
        reasoning: 'No intent reached the configured threshold.',
      },
    ];

    console.log('[intent-detection] fallback', {
      message: input.message,
      fallback,
    });

    return fallback;
  }

  private matchKeywords(
    message: string,
    intents: IntentDetectionTarget[]
  ): DetectedIntent[] {
    const normalized = this.normalizeText(message);
    const matches: DetectedIntent[] = [];
    const seen = new Set<string>();

    for (const intent of intents) {
      if (intent.id === OFF_TOPIC_INTENT_ID) continue;
      if (seen.has(intent.id)) continue;

      const matched = intent.keywords.some((keyword) => {
        const normalizedKeyword = this.normalizeText(keyword);
        return (
          normalizedKeyword.length > 0 && normalized.includes(normalizedKeyword)
        );
      });

      if (matched) {
        seen.add(intent.id);
        matches.push({
          intentId: intent.id,
          confidence: KEYWORD_MATCH_CONFIDENCE,
          reasoning: KEYWORD_MATCH_REASON,
        });
      }
    }

    return matches;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
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

  private normalizeLlmResponse(
    response: IntentDetectorResponse,
    validIntentIds: Set<string>,
    threshold: number
  ): DetectedIntent[] {
    return response
      .filter(
        (intent) =>
          validIntentIds.has(intent.intentId) && intent.confidence >= threshold
      )
      .map((intent) => ({
        intentId: intent.intentId,
        confidence: intent.confidence,
        reasoning: intent.reasoning,
      }));
  }

  private normalizeThreshold(threshold: number): number {
    if (Number.isNaN(threshold)) return 0.5;

    return Math.min(1, Math.max(0, threshold));
  }
}
