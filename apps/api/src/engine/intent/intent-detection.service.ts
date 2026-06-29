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
  sessionId?: string;
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

    // 1. LLM scores EVERY intent — always runs, guarantees all are evaluated
    const response = await this.llm.invokeStructured(
      this.buildMessages(input, threshold),
      IntentDetectorResponseSchema,
      { sessionId: input.sessionId }
    );

    console.log('[intent-detection] raw llm response', {
      message: input.message,
      intentCount: input.intents.length,
      threshold,
      response,
    });

    const llmScored = this.normalizeLlmResponse(response, validIntentIds);

    // 2. Deterministic keyword verification, concatenated on top of the LLM
    //    scores (overrides to confidence 1.0 when matched).
    const merged = new Map<string, DetectedIntent>();
    for (const scored of llmScored) {
      merged.set(scored.intentId, scored);
    }
    for (const keyword of this.matchKeywords(input.message, input.intents)) {
      merged.set(keyword.intentId, keyword);
    }

    console.log('[intent-detection] keyword matches', {
      message: input.message,
      matched: Array.from(merged.values()).filter(
        (intent) => intent.reasoning === KEYWORD_MATCH_REASON
      ),
    });

    // 3. Filter by threshold
    const combined = Array.from(merged.values()).filter(
      (intent) => intent.confidence >= threshold
    );

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
    validIntentIds: Set<string>
  ): DetectedIntent[] {
    const byId = new Map<string, DetectedIntent>();

    for (const entry of response) {
      if (!validIntentIds.has(entry.intentId)) continue;
      byId.set(entry.intentId, {
        intentId: entry.intentId,
        confidence: entry.confidence,
        reasoning: entry.reasoning,
      });
    }

    // Guarantee every intent is scored: fill any the model omitted with 0
    // so nothing can be silently skipped.
    for (const id of validIntentIds) {
      if (!byId.has(id)) {
        byId.set(id, {
          intentId: id,
          confidence: 0,
          reasoning: 'Not scored by the model.',
        });
      }
    }

    return Array.from(byId.values());
  }

  private normalizeThreshold(threshold: number): number {
    if (Number.isNaN(threshold)) return 0.5;

    return Math.min(1, Math.max(0, threshold));
  }
}
