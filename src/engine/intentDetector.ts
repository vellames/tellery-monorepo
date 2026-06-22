import { z } from "zod";
import { INTENT_DETECTOR_MODEL } from "../config";
import { createOpenRouterChatModel } from "../openrouter";
import { normalizeLanguage, t, SupportedLanguage } from "../i18n";
import { IntentDefinition } from "../models";

const IntentDetectorResponseSchema = z.object({
  primaryIntentId: z.string(),
  intentIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

type IntentDetectorModelResponse = z.infer<typeof IntentDetectorResponseSchema>;

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
      }),
    },
  ]);

  return normalizeDetectedIntent(
    response,
    intentIds,
    fallbackIntentId,
    language,
    model
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

function normalizeDetectedIntent(
  response: IntentDetectorModelResponse,
  validIntentIds: Set<string>,
  fallbackIntentId: string,
  language: SupportedLanguage,
  model: string
): DetectedIntent {
  const responseIntentIds = response.intentIds.filter((intentId) =>
    validIntentIds.has(intentId)
  );

  const primaryIntentId = validIntentIds.has(response.primaryIntentId)
    ? response.primaryIntentId
    : (responseIntentIds[0] ?? fallbackIntentId);

  const normalizedIntentIds = Array.from(
    new Set([primaryIntentId, ...responseIntentIds])
  );

  return {
    primaryIntentId,
    intentIds: normalizedIntentIds,
    confidence: response.confidence,
    reasoning: response.reasoning,
    language,
    model,
  };
}
