import { INTENT_DETECTOR_MODEL } from "../config";
import { chat } from "../openrouter";
import { normalizeLanguage, t, SupportedLanguage } from "../i18n";
import { IntentDefinition } from "../models";

export interface DetectIntentInput {
  message: string;
  intents: IntentDefinition[];
  language?: string;
  model?: string;
}

export interface DetectedIntent {
  primaryIntentId: string;
  intentIds: string[];
  confidence: number;
  reasoning: string;
  language: SupportedLanguage;
  model: string;
}

interface IntentDetectorModelResponse {
  primaryIntentId?: unknown;
  intentIds?: unknown;
  confidence?: unknown;
  reasoning?: unknown;
}

export async function detectIntent(
  input: DetectIntentInput
): Promise<DetectedIntent> {
  if (input.intents.length === 0) {
    throw new Error("detectIntent requires at least one intent");
  }

  const language = normalizeLanguage(input.language);
  const model = input.model ?? INTENT_DETECTOR_MODEL;
  const intentIds = new Set(input.intents.map((intent) => intent.id));
  const fallbackIntentId = intentIds.has("off_topic")
    ? "off_topic"
    : input.intents[0].id;

  const { reply, model: responseModel } = await chat(
    [
      {
        role: "system",
        content: t(language, "intentDetectorSystemPrompt"),
      },
      {
        role: "user",
        content: t(language, "intentDetectorUserPrompt", {
          message: input.message,
          intents: formatIntentsForPrompt(input.intents),
        }),
      },
    ],
    model
  );

  return normalizeDetectedIntent(
    parseModelJson(reply),
    intentIds,
    fallbackIntentId,
    language,
    responseModel
  );
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

function parseModelJson(reply: string): IntentDetectorModelResponse {
  const trimmedReply = reply.trim();
  const jsonMatch = trimmedReply.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(`Intent detector returned non-JSON response: ${reply}`);
  }

  return JSON.parse(jsonMatch[0]) as IntentDetectorModelResponse;
}

function normalizeDetectedIntent(
  response: IntentDetectorModelResponse,
  validIntentIds: Set<string>,
  fallbackIntentId: string,
  language: SupportedLanguage,
  model: string
): DetectedIntent {
  const responseIntentIds = Array.isArray(response.intentIds)
    ? response.intentIds.filter(
        (intentId): intentId is string =>
          typeof intentId === "string" && validIntentIds.has(intentId)
      )
    : [];

  const primaryIntentId =
    typeof response.primaryIntentId === "string" &&
    validIntentIds.has(response.primaryIntentId)
      ? response.primaryIntentId
      : (responseIntentIds[0] ?? fallbackIntentId);

  const normalizedIntentIds = Array.from(
    new Set([primaryIntentId, ...responseIntentIds])
  );

  return {
    primaryIntentId,
    intentIds: normalizedIntentIds,
    confidence: normalizeConfidence(response.confidence),
    reasoning: typeof response.reasoning === "string" ? response.reasoning : "",
    language,
    model,
  };
}

function normalizeConfidence(confidence: unknown): number {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return 0;

  return Math.min(1, Math.max(0, confidence));
}
