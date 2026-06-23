import { z } from "zod";
import {
  INTENT_DETECTOR_MODEL,
  INTENT_DETECTOR_THRESHOLD,
} from "../config/app.config";
import { createOpenRouterChatModel } from "../openrouter";
import { normalizeLanguage, t, SupportedLanguage } from "@ai-history/i18n";
import { IntentDefinition } from "../models";

const IntentDetectorResponseSchema = z.array(
  z.object({
    intentId: z.string(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
  })
);

type IntentDetectorModelResponse = z.infer<typeof IntentDetectorResponseSchema>;

export interface DetectIntentInput {
  message: string;
  intents: IntentDefinition[];
  language?: string;
  model?: string;
}

export interface DetectedIntent {
  intentId: string;
  confidence: number;
  reasoning: string;
  language: SupportedLanguage;
  model: string;
}

export async function detectIntent(
  input: DetectIntentInput
): Promise<DetectedIntent[]> {
  if (input.intents.length === 0) {
    throw new Error("detectIntent requires at least one intent");
  }

  const language = normalizeLanguage(input.language);
  const model = input.model ?? INTENT_DETECTOR_MODEL;
  const threshold = normalizeThreshold(INTENT_DETECTOR_THRESHOLD);
  const intentIds = new Set(input.intents.map((intent) => intent.id));
  const fallbackIntentId = intentIds.has("off_topic")
    ? "off_topic"
    : input.intents[0].id;

  const llm = createOpenRouterChatModel(model);
  const structuredLlm = llm.withStructuredOutput(IntentDetectorResponseSchema, {
    name: "classify_user_intent",
  });

  const response = await structuredLlm.invoke([
    {
      role: "system",
      content: t(language, "intentDetectorSystemPrompt"),
    },
    {
      role: "user",
      content: t(language, "intentDetectorUserPrompt", {
        message: input.message,
        intents: formatIntentsForPrompt(input.intents),
        threshold: threshold.toString(),
      }),
    },
  ]);

  return normalizeDetectedIntent(
    response,
    intentIds,
    fallbackIntentId,
    language,
    model,
    threshold
  );
}

function normalizeThreshold(threshold: number): number {
  if (Number.isNaN(threshold)) return 0.5;

  return Math.min(1, Math.max(0, threshold));
}

function formatIntentsForPrompt(intents: IntentDefinition[]): string {
  return intents
    .map((intent) => {
      const examples = intent.examples.join(" | ");
      const keywords = intent.keywords.join(", ");

      return `- ${intent.id}: ${intent.description}\n  examples: ${examples}\n  keywords: ${keywords}`;
    })
    .join("\n");
}

function normalizeDetectedIntent(
  response: IntentDetectorModelResponse,
  validIntentIds: Set<string>,
  fallbackIntentId: string,
  language: SupportedLanguage,
  model: string,
  threshold: number
): DetectedIntent[] {
  const detectedIntents = response
    .filter(
      (intent) =>
        validIntentIds.has(intent.intentId) && intent.confidence >= threshold
    )
    .map((intent) => ({
      intentId: intent.intentId,
      confidence: intent.confidence,
      reasoning: intent.reasoning,
      language,
      model,
    }));

  if (detectedIntents.length > 0) return detectedIntents;

  return [
    {
      intentId: fallbackIntentId,
      confidence: 0,
      reasoning: "No intent reached the configured threshold.",
      language,
      model,
    },
  ];
}
