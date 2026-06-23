import { z } from "zod";
import { CHARACTER_AGENT_MODEL } from "../config";
import { normalizeLanguage, SupportedLanguage, t } from "../i18n";
import {
  CharacterClueRevealRule,
  CharacterDefinition,
  CharacterSecret,
  ClueDefinition,
  SecretRevealStage,
} from "../models";
import { CharacterSessionState } from "../models";
import { CharacterConversationMessage } from "../repositories";
import { createOpenRouterChatModel } from "../openrouter";
import { DetectedIntent } from "./intentDetector";

const CharacterAgentResponseSchema = z.object({
  reply: z.string(),
  discoveredClues: z.array(
    z.object({
      clueId: z.string(),
      reasoning: z.string(),
    })
  ),
  updatedConversationSummary: z.string(),
});

type CharacterAgentModelResponse = z.infer<typeof CharacterAgentResponseSchema>;

export interface RunCharacterAgentInput {
  character: CharacterDefinition;
  characterState: CharacterSessionState;
  clues: ClueDefinition[];
  detectedIntents: DetectedIntent[];
  discoveredClueIds: string[];
  interaction: string;
  recentConversation: CharacterConversationMessage[];
  language?: string;
  model?: string;
}

export interface CharacterAgentDiscoveredClue {
  clueId: string;
  reasoning: string;
  language: SupportedLanguage;
  model: string;
}

export interface CharacterAgentResult {
  reply: string;
  discoveredClues: CharacterAgentDiscoveredClue[];
  updatedConversationSummary: string;
  language: SupportedLanguage;
  model: string;
}

export async function runCharacterAgent(
  input: RunCharacterAgentInput
): Promise<CharacterAgentResult> {
  const language = normalizeLanguage(input.language);
  const model = input.model ?? CHARACTER_AGENT_MODEL;
  const eligibleClueRules = getEligibleCharacterClueRules(
    input.character.clueRevealRules,
    input.detectedIntents,
    input.discoveredClueIds
  );
  const eligibleSecretStages = getEligibleSecretStages(
    input.character.secrets,
    input.detectedIntents,
    input.discoveredClueIds
  );

  const llm = createOpenRouterChatModel(model);
  const structuredLlm = llm.withStructuredOutput(CharacterAgentResponseSchema, {
    name: "respond_as_character",
  });

  const response = await structuredLlm.invoke([
    {
      role: "system",
      content: t(language, "characterAgentSystemPrompt"),
    },
    {
      role: "user",
      content: t(language, "characterAgentUserPrompt", {
        character: formatCharacterForPrompt(input.character),
        conversationSummary:
          input.characterState.conversationSummary ?? "Sem resumo ainda.",
        recentConversation: formatConversationForPrompt(
          input.recentConversation
        ),
        interaction: input.interaction,
        detectedIntents: JSON.stringify(input.detectedIntents, null, 2),
        discoveredClueIds: JSON.stringify(input.discoveredClueIds),
        eligibleClueRules: formatCharacterClueRulesForPrompt(
          eligibleClueRules,
          input.clues
        ),
        eligibleSecretStages: formatSecretStagesForPrompt(
          eligibleSecretStages,
          input.clues
        ),
      }),
    },
  ]);

  return normalizeCharacterAgentResponse(
    response,
    eligibleClueRules,
    eligibleSecretStages,
    language,
    model
  );
}

function getEligibleCharacterClueRules(
  rules: CharacterClueRevealRule[],
  detectedIntents: DetectedIntent[],
  discoveredClueIds: string[]
): CharacterClueRevealRule[] {
  const detectedIntentIds = new Set(
    detectedIntents.map((detectedIntent) => detectedIntent.intentId)
  );
  const discoveredClues = new Set(discoveredClueIds);
  const eligibleRules: CharacterClueRevealRule[] = [];
  const eligibleRuleClueIds = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;

    for (const rule of rules) {
      if (discoveredClues.has(rule.clueId)) continue;
      if (eligibleRuleClueIds.has(rule.clueId)) continue;

      const hasTriggerIntent = rule.triggerIntents.some((intentId) =>
        detectedIntentIds.has(intentId)
      );
      const hasRequiredClues = (rule.requiresClueIds ?? []).every((clueId) =>
        discoveredClues.has(clueId)
      );

      if (!hasTriggerIntent || !hasRequiredClues) continue;

      eligibleRules.push(rule);
      eligibleRuleClueIds.add(rule.clueId);
      discoveredClues.add(rule.clueId);
      changed = true;
    }
  }

  return eligibleRules;
}

function getEligibleSecretStages(
  secrets: CharacterSecret[],
  detectedIntents: DetectedIntent[],
  discoveredClueIds: string[]
): Array<{ secret: CharacterSecret; stage: SecretRevealStage }> {
  const detectedIntentIds = new Set(
    detectedIntents.map((detectedIntent) => detectedIntent.intentId)
  );
  const discoveredClues = new Set(discoveredClueIds);

  return secrets.flatMap((secret) =>
    secret.revealStages
      .filter((stage) => {
        const hasTriggerIntent = stage.triggerIntents.some((intentId) =>
          detectedIntentIds.has(intentId)
        );
        const hasRequiredClues = (stage.requiresClueIds ?? []).every((clueId) =>
          discoveredClues.has(clueId)
        );

        return hasTriggerIntent && hasRequiredClues;
      })
      .map((stage) => ({ secret, stage }))
  );
}

function formatCharacterForPrompt(character: CharacterDefinition): string {
  return JSON.stringify(
    {
      id: character.id,
      name: character.name,
      role: character.role,
      shortDescription: character.shortDescription,
      personality: character.personality,
      speakingStyle: character.speakingStyle,
      publicKnowledge: character.publicKnowledge,
      privateKnowledge: character.privateKnowledge,
      openingLine: character.openingLine,
      conversationBoundaries: character.conversationBoundaries,
    },
    null,
    2
  );
}

function formatConversationForPrompt(
  conversation: CharacterConversationMessage[]
): string {
  if (conversation.length === 0) return "Sem historico recente.";

  return conversation
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
}

function formatCharacterClueRulesForPrompt(
  rules: CharacterClueRevealRule[],
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

function formatSecretStagesForPrompt(
  stages: Array<{ secret: CharacterSecret; stage: SecretRevealStage }>,
  clues: ClueDefinition[]
): string {
  return JSON.stringify(
    stages.map(({ secret, stage }) => ({
      secretId: secret.id,
      secretSummary: secret.summary,
      secretTruth: secret.truth,
      defaultStrategy: secret.defaultStrategy,
      stage,
      revealsClues: (stage.revealsClueIds ?? []).map((clueId) => ({
        clueId,
        clue: clues.find((clue) => clue.id === clueId) ?? null,
      })),
    })),
    null,
    2
  );
}

function normalizeCharacterAgentResponse(
  response: CharacterAgentModelResponse,
  eligibleClueRules: CharacterClueRevealRule[],
  eligibleSecretStages: Array<{
    secret: CharacterSecret;
    stage: SecretRevealStage;
  }>,
  language: SupportedLanguage,
  model: string
): CharacterAgentResult {
  const eligibleClueIds = [
    ...eligibleClueRules.map((rule) => rule.clueId),
    ...eligibleSecretStages.flatMap(({ stage }) => stage.revealsClueIds ?? []),
  ];
  const eligibleClueIdSet = new Set(eligibleClueIds);
  const modelDiscoveredClues = response.discoveredClues.filter((result) =>
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
        "Automatically included because the character reveal rule or secret stage was eligible for this interaction.",
    }));

  return {
    reply: response.reply,
    discoveredClues: [...modelDiscoveredClues, ...enforcedDiscoveredClues].map(
      (result) => ({
        clueId: result.clueId,
        reasoning: result.reasoning,
        language,
        model,
      })
    ),
    updatedConversationSummary: response.updatedConversationSummary,
    language,
    model,
  };
}
