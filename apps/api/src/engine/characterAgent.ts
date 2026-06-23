import { z } from 'zod';
import { appConfig } from '../config/app.config';
import { normalizeLanguage, SupportedLanguage, t } from '@ai-history/i18n';
import {
  CharacterClueRevealRule,
  CharacterDefinition,
  CharacterSecret,
  CharacterSecretSessionState,
  ClueDefinition,
  SecretRevealStage,
} from '../models';
import { CharacterSessionState } from '../models';
import { CharacterConversationMessage } from '../interfaces';
import { createOpenRouterChatModel } from '../openrouter';
import { DetectedIntent } from './intentDetector';

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
  updatedSecretStates: CharacterSecretSessionState[];
  language: SupportedLanguage;
  model: string;
}

export async function runCharacterAgent(
  input: RunCharacterAgentInput
): Promise<CharacterAgentResult> {
  const language = normalizeLanguage(input.language);
  const model = input.model ?? appConfig.openrouter.characterAgentModel;
  const eligibleClueRules = getEligibleCharacterClueRules(
    input.character.clueRevealRules,
    input.detectedIntents,
    input.discoveredClueIds
  );
  const eligibleSecretStages = getEligibleSecretStages(
    input.character.secrets,
    input.characterState.secretStates,
    input.detectedIntents,
    input.discoveredClueIds
  );

  const llm = createOpenRouterChatModel(model);
  const structuredLlm = llm.withStructuredOutput(CharacterAgentResponseSchema, {
    name: 'respond_as_character',
  });

  const response = await structuredLlm.invoke([
    {
      role: 'system',
      content: t(language, 'characterAgentSystemPrompt'),
    },
    {
      role: 'user',
      content: t(language, 'characterAgentUserPrompt', {
        character: formatCharacterForPrompt(input.character),
        conversationSummary:
          input.characterState.conversationSummary ?? 'Sem resumo ainda.',
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
          input.clues,
          input.characterState.secretStates
        ),
      }),
    },
  ]);

  return normalizeCharacterAgentResponse(
    response,
    eligibleClueRules,
    eligibleSecretStages,
    input.characterState.secretStates,
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
  secretStates: CharacterSecretSessionState[],
  detectedIntents: DetectedIntent[],
  discoveredClueIds: string[]
): Array<{ secret: CharacterSecret; stage: SecretRevealStage }> {
  const detectedIntentIds = new Set(
    detectedIntents.map((detectedIntent) => detectedIntent.intentId)
  );
  const discoveredClues = new Set(discoveredClueIds);

  return secrets.flatMap((secret) => {
    const secretState = secretStates.find((s) => s.secretId === secret.id);
    const currentLevel = secretState?.currentStageLevel ?? -1;

    const sortedStages = [...secret.revealStages].sort(
      (stageA, stageB) => stageA.level - stageB.level
    );

    const eligibleStages = sortedStages.filter((stage) => {
      if (stage.level <= currentLevel) return false;

      const hasTriggerIntent = stage.triggerIntents.some((intentId) =>
        detectedIntentIds.has(intentId)
      );
      const hasRequiredClues = (stage.requiresClueIds ?? []).every((clueId) =>
        discoveredClues.has(clueId)
      );

      return hasTriggerIntent && hasRequiredClues;
    });

    const highestEligibleStage = eligibleStages.at(-1);
    if (!highestEligibleStage) return [];

    return sortedStages
      .filter(
        (stage) =>
          stage.level > currentLevel &&
          stage.level <= highestEligibleStage.level
      )
      .map((stage) => ({ secret, stage }));
  });
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
  if (conversation.length === 0) return 'Sem historico recente.';

  return conversation
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');
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
  clues: ClueDefinition[],
  secretStates: CharacterSecretSessionState[]
): string {
  return JSON.stringify(
    stages.map(({ secret, stage }) => {
      const secretState = secretStates.find((s) => s.secretId === secret.id);
      return {
        secretId: secret.id,
        secretSummary: secret.summary,
        secretTruth: secret.truth,
        defaultStrategy: secret.defaultStrategy,
        currentStageLevel: secretState?.currentStageLevel ?? -1,
        nextStageLevel: stage.level,
        stage,
        revealsClues: (stage.revealsClueIds ?? []).map((clueId) => ({
          clueId,
          clue: clues.find((clue) => clue.id === clueId) ?? null,
        })),
      };
    }),
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
  existingSecretStates: CharacterSecretSessionState[],
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
        'Automatically included because the character reveal rule or secret stage was eligible for this interaction.',
    }));

  const updatedSecretStates: CharacterSecretSessionState[] = Array.from(
    new Set(eligibleSecretStages.map(({ secret }) => secret.id))
  ).map((secretId) => {
    const secretStages = eligibleSecretStages.filter(
      ({ secret }) => secret.id === secretId
    );
    const existing = existingSecretStates.find((s) => s.secretId === secretId);
    const currentStageLevel = Math.max(
      existing?.currentStageLevel ?? -1,
      ...secretStages.map(({ stage }) => stage.level)
    );
    const revealedStageIds = Array.from(
      new Set([
        ...(existing?.revealedStageIds ?? []),
        ...secretStages.map(({ stage }) => stage.id),
      ])
    );
    const revealedClueIds = Array.from(
      new Set([
        ...(existing?.revealedClueIds ?? []),
        ...secretStages.flatMap(({ stage }) => stage.revealsClueIds ?? []),
      ])
    );

    return {
      secretId,
      currentStageLevel,
      revealedStageIds,
      revealedClueIds,
    };
  });

  const mergedSecretStates = existingSecretStates
    .filter((s) => !updatedSecretStates.some((u) => u.secretId === s.secretId))
    .concat(updatedSecretStates);

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
    updatedSecretStates: mergedSecretStates,
    language,
    model,
  };
}
