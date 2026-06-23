import { z } from 'zod';
import { appConfig } from '../config/app.config';
import { normalizeLanguage, SupportedLanguage, t } from '@ai-history/i18n';
import { createOpenRouterChatModel } from '../openrouter';
import {
  ClueDefinition,
  ObjectClueRevealRule,
  ObjectDefinition,
} from '../models';
import { DetectedIntent } from './intentDetector';

const ObjectAgentResponseSchema = z.array(
  z.object({
    clueId: z.string(),
    reasoning: z.string(),
  })
);

type ObjectAgentModelResponse = z.infer<typeof ObjectAgentResponseSchema>;

export interface RunObjectAgentInput {
  object: ObjectDefinition;
  clues: ClueDefinition[];
  detectedIntents: DetectedIntent[];
  discoveredClueIds: string[];
  language?: string;
  model?: string;
}

export interface ObjectAgentDiscoveredClue {
  clueId: string;
  reasoning: string;
  language: SupportedLanguage;
  model: string;
}

export async function runObjectAgent(
  input: RunObjectAgentInput
): Promise<ObjectAgentDiscoveredClue[]> {
  const language = normalizeLanguage(input.language);
  const model = input.model ?? appConfig.openrouter.objectAgentModel;
  const eligibleRules = getEligibleObjectRules(
    input.object.clueRevealRules,
    input.detectedIntents,
    input.discoveredClueIds
  );

  if (eligibleRules.length === 0) return [];

  const llm = createOpenRouterChatModel(model);
  const structuredLlm = llm.withStructuredOutput(ObjectAgentResponseSchema, {
    name: 'evaluate_object_clue_reveals',
  });

  const response = await structuredLlm.invoke([
    {
      role: 'system',
      content: t(language, 'objectAgentSystemPrompt'),
    },
    {
      role: 'user',
      content: t(language, 'objectAgentUserPrompt', {
        object: formatObjectForPrompt(input.object),
        detectedIntents: JSON.stringify(input.detectedIntents, null, 2),
        discoveredClueIds: JSON.stringify(input.discoveredClueIds),
        eligibleRules: formatObjectRulesForPrompt(eligibleRules, input.clues),
      }),
    },
  ]);

  return normalizeObjectAgentResponse(response, eligibleRules, language, model);
}

function getEligibleObjectRules(
  rules: ObjectClueRevealRule[],
  detectedIntents: DetectedIntent[],
  discoveredClueIds: string[]
): ObjectClueRevealRule[] {
  const detectedIntentIds = new Set(
    detectedIntents.map((detectedIntent) => detectedIntent.intentId)
  );
  const discoveredClues = new Set(discoveredClueIds);

  return rules.filter((rule) => {
    const hasTriggerIntent = rule.triggerIntents.some((intentId) =>
      detectedIntentIds.has(intentId)
    );
    const hasRequiredClues = (rule.requiresClueIds ?? []).every((clueId) =>
      discoveredClues.has(clueId)
    );

    return (
      hasTriggerIntent && hasRequiredClues && !discoveredClues.has(rule.clueId)
    );
  });
}

function formatObjectForPrompt(object: ObjectDefinition): string {
  return JSON.stringify(
    {
      id: object.id,
      name: object.name,
      shortDescription: object.shortDescription,
      locationId: object.locationId,
      initialDescription: object.initialDescription,
    },
    null,
    2
  );
}

function formatObjectRulesForPrompt(
  rules: ObjectClueRevealRule[],
  clues: ClueDefinition[]
): string {
  return JSON.stringify(
    rules.map((rule) => ({
      ...rule,
      clue: clues.find((clue) => clue.id === rule.clueId) ?? null,
    })),
    null,
    2
  );
}

function normalizeObjectAgentResponse(
  response: ObjectAgentModelResponse,
  eligibleRules: ObjectClueRevealRule[],
  language: SupportedLanguage,
  model: string
): ObjectAgentDiscoveredClue[] {
  const eligibleClueIds = eligibleRules.map((rule) => rule.clueId);
  const eligibleClueIdSet = new Set(eligibleClueIds);
  const modelDiscoveredClues = response.filter((result) =>
    eligibleClueIdSet.has(result.clueId)
  );
  const modelDiscoveredClueIds = new Set(
    modelDiscoveredClues.map((result) => result.clueId)
  );
  const enforcedDiscoveredClues = eligibleClueIds
    .filter((clueId) => !modelDiscoveredClueIds.has(clueId))
    .map((clueId) => ({
      clueId,
      reasoning:
        'Automatically included because the object reveal rule was eligible for this interaction.',
    }));

  return [...modelDiscoveredClues, ...enforcedDiscoveredClues].map(
    (result) => ({
      clueId: result.clueId,
      reasoning: result.reasoning,
      language,
      model,
    })
  );
}
