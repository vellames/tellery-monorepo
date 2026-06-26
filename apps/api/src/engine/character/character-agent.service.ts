import { SupportedLanguage } from '@ai-history/i18n';
import { z } from 'zod';
import { DetectedIntent } from '../intent/intent-detection.service';
import {
  ChatMessage,
  IStructuredChatModel,
} from '../llm/structured-chat-model.interface';

const SYSTEM_PROMPT_KEY = 'characterAgentSystemPrompt';
const USER_PROMPT_KEY = 'characterAgentUserPrompt';
const ENFORCEMENT_REASONING =
  'Automatically included because the character reveal rule or secret stage was eligible for this interaction.';
const NO_CONVERSATION_SUMMARY = 'Sem resumo ainda.';

export interface CharacterAgentCharacter {
  id: string;
  name: string;
  role: string;
  shortDescription: string;
  personality: string;
  speakingStyle: string;
  publicKnowledge: string[];
  privateKnowledge: string[];
  openingLine: string;
  conversationBoundaries: string[];
}

export interface CharacterClueRule {
  clueId: string;
  revealText: string;
  clueTitle: string;
  clueDescription: string;
  triggerIntentIds: string[];
  requiredClueIds: string[];
}

export interface CharacterSecretStage {
  stageId: string;
  level: number;
  behavior: string;
  allowedToRevealTruth: boolean;
  sampleResponses: string[];
  triggerIntentIds: string[];
  requiredClueIds: string[];
  revealsClueIds: string[];
}

export interface CharacterSecret {
  secretId: string;
  currentStageLevel: number;
  summary: string;
  truth: string;
  defaultStrategy: string;
  stages: CharacterSecretStage[];
}

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface RunCharacterAgentInput {
  character: CharacterAgentCharacter;
  conversationSummary: string | null;
  recentConversation: ConversationMessage[];
  interaction: string;
  detectedIntents: DetectedIntent[];
  discoveredClueIds: string[];
  clueRules: CharacterClueRule[];
  secrets: CharacterSecret[];
  language: SupportedLanguage;
}

export interface CharacterAgentDiscoveredClue {
  clueId: string;
  reasoning: string;
}

export interface UpdatedSecretState {
  secretId: string;
  currentStageLevel: number;
  revealedStageIds: string[];
  revealedClueIds: string[];
}

export interface CharacterAgentResult {
  reply: string;
  discoveredClues: CharacterAgentDiscoveredClue[];
  updatedConversationSummary: string;
  updatedSecretStates: UpdatedSecretState[];
}

export type CharacterTranslationFn = (
  language: SupportedLanguage,
  key: string,
  params?: Record<string, string>
) => string;

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

type CharacterAgentResponse = z.infer<typeof CharacterAgentResponseSchema>;

export class CharacterAgent {
  constructor(
    private readonly llm: IStructuredChatModel,
    private readonly translate: CharacterTranslationFn
  ) {}

  async run(input: RunCharacterAgentInput): Promise<CharacterAgentResult> {
    const eligibleClueRules = this.getEligibleClueRules(
      input.clueRules,
      input.detectedIntents,
      input.discoveredClueIds
    );
    const eligibleSecretStages = this.getEligibleSecretStages(
      input.secrets,
      input.detectedIntents,
      input.discoveredClueIds
    );

    const response = await this.llm.invokeStructured(
      this.buildMessages(input, eligibleClueRules, eligibleSecretStages),
      CharacterAgentResponseSchema
    );

    console.log('[character-agent] raw llm response', {
      characterId: input.character.id,
      eligibleClueRuleCount: eligibleClueRules.length,
      eligibleSecretStageCount: eligibleSecretStages.length,
      response,
    });

    const discoveredClues = this.normalizeDiscoveredClues(
      response,
      eligibleClueRules,
      eligibleSecretStages
    );
    const updatedSecretStates = this.computeUpdatedSecretStates(
      eligibleSecretStages
    );

    console.log('[character-agent] result', {
      characterId: input.character.id,
      discoveredClueCount: discoveredClues.length,
      advancedSecretCount: updatedSecretStates.length,
    });

    return {
      reply: response.reply,
      discoveredClues,
      updatedConversationSummary: response.updatedConversationSummary,
      updatedSecretStates,
    };
  }

  private getEligibleClueRules(
    rules: CharacterClueRule[],
    detectedIntents: DetectedIntent[],
    discoveredClueIds: string[]
  ): CharacterClueRule[] {
    const detectedIntentIds = new Set(
      detectedIntents.map((detectedIntent) => detectedIntent.intentId)
    );
    const discovered = new Set(discoveredClueIds);
    const eligible: CharacterClueRule[] = [];
    const eligibleClueIds = new Set<string>();
    let changed = true;

    while (changed) {
      changed = false;

      for (const rule of rules) {
        if (discovered.has(rule.clueId)) continue;
        if (eligibleClueIds.has(rule.clueId)) continue;

        const hasTriggerIntent = rule.triggerIntentIds.some((intentId) =>
          detectedIntentIds.has(intentId)
        );
        const hasRequiredClues = rule.requiredClueIds.every((clueId) =>
          discovered.has(clueId)
        );

        if (!hasTriggerIntent || !hasRequiredClues) continue;

        eligible.push(rule);
        eligibleClueIds.add(rule.clueId);
        discovered.add(rule.clueId);
        changed = true;
      }
    }

    return eligible;
  }

  private getEligibleSecretStages(
    secrets: CharacterSecret[],
    detectedIntents: DetectedIntent[],
    discoveredClueIds: string[]
  ): Array<{ secret: CharacterSecret; stage: CharacterSecretStage }> {
    const detectedIntentIds = new Set(
      detectedIntents.map((detectedIntent) => detectedIntent.intentId)
    );
    const discovered = new Set(discoveredClueIds);

    return secrets.flatMap((secret) => {
      const sortedStages = [...secret.stages].sort(
        (stageA, stageB) => stageA.level - stageB.level
      );

      const eligibleStages = sortedStages.filter((stage) => {
        if (stage.level <= secret.currentStageLevel) return false;

        const hasTriggerIntent = stage.triggerIntentIds.some((intentId) =>
          detectedIntentIds.has(intentId)
        );
        const hasRequiredClues = stage.requiredClueIds.every((clueId) =>
          discovered.has(clueId)
        );

        return hasTriggerIntent && hasRequiredClues;
      });

      const highestEligibleStage = eligibleStages.at(-1);
      if (!highestEligibleStage) return [];

      return sortedStages
        .filter(
          (stage) =>
            stage.level > secret.currentStageLevel &&
            stage.level <= highestEligibleStage.level
        )
        .map((stage) => ({ secret, stage }));
    });
  }

  private buildMessages(
    input: RunCharacterAgentInput,
    eligibleClueRules: CharacterClueRule[],
    eligibleSecretStages: Array<{
      secret: CharacterSecret;
      stage: CharacterSecretStage;
    }>
  ): ChatMessage[] {
    return [
      {
        role: 'system',
        content: this.translate(input.language, SYSTEM_PROMPT_KEY),
      },
      {
        role: 'user',
        content: this.translate(input.language, USER_PROMPT_KEY, {
          character: JSON.stringify(
            {
              id: input.character.id,
              name: input.character.name,
              role: input.character.role,
              shortDescription: input.character.shortDescription,
              personality: input.character.personality,
              speakingStyle: input.character.speakingStyle,
              publicKnowledge: input.character.publicKnowledge,
              privateKnowledge: input.character.privateKnowledge,
              openingLine: input.character.openingLine,
              conversationBoundaries: input.character.conversationBoundaries,
            },
            null,
            2
          ),
          conversationSummary:
            input.conversationSummary ?? NO_CONVERSATION_SUMMARY,
          recentConversation: this.formatConversation(
            input.recentConversation
          ),
          interaction: input.interaction,
          detectedIntents: JSON.stringify(input.detectedIntents, null, 2),
          discoveredClueIds: JSON.stringify(input.discoveredClueIds),
          eligibleClueRules: JSON.stringify(
            eligibleClueRules.map((rule) => ({
              clueId: rule.clueId,
              revealText: rule.revealText,
              clue: {
                title: rule.clueTitle,
                description: rule.clueDescription,
              },
              triggerIntentIds: rule.triggerIntentIds,
              requiredClueIds: rule.requiredClueIds,
            })),
            null,
            2
          ),
          eligibleSecretStages: JSON.stringify(
            eligibleSecretStages.map(({ secret, stage }) => ({
              secretId: secret.secretId,
              secretSummary: secret.summary,
              secretTruth: secret.truth,
              defaultStrategy: secret.defaultStrategy,
              currentStageLevel: secret.currentStageLevel,
              nextStageLevel: stage.level,
              stage,
              revealsClues: stage.revealsClueIds,
            })),
            null,
            2
          ),
        }),
      },
    ];
  }

  private formatConversation(messages: ConversationMessage[]): string {
    if (messages.length === 0) return 'Sem historico recente.';

    return messages
      .map((message) => `${message.role}: ${message.content}`)
      .join('\n');
  }

  private normalizeDiscoveredClues(
    response: CharacterAgentResponse,
    eligibleClueRules: CharacterClueRule[],
    eligibleSecretStages: Array<{
      secret: CharacterSecret;
      stage: CharacterSecretStage;
    }>
  ): CharacterAgentDiscoveredClue[] {
    const eligibleClueIds = [
      ...eligibleClueRules.map((rule) => rule.clueId),
      ...eligibleSecretStages.flatMap(({ stage }) => stage.revealsClueIds),
    ];
    const eligibleClueIdSet = new Set(eligibleClueIds);

    const fromModel = response.discoveredClues.filter((result) =>
      eligibleClueIdSet.has(result.clueId)
    );
    const modelClueIds = new Set(fromModel.map((result) => result.clueId));

    const enforced = eligibleClueIds
      .filter((clueId) => !modelClueIds.has(clueId))
      .map((clueId) => ({
        clueId,
        reasoning: ENFORCEMENT_REASONING,
      }));

    return [...fromModel, ...enforced];
  }

  private computeUpdatedSecretStates(
    eligibleSecretStages: Array<{
      secret: CharacterSecret;
      stage: CharacterSecretStage;
    }>
  ): UpdatedSecretState[] {
    const bySecret = new Map<string, CharacterSecretStage[]>();

    for (const { secret, stage } of eligibleSecretStages) {
      const stages = bySecret.get(secret.secretId) ?? [];
      stages.push(stage);
      bySecret.set(secret.secretId, stages);
    }

    return Array.from(bySecret.entries()).map(([secretId, stages]) => ({
      secretId,
      currentStageLevel: Math.max(...stages.map((stage) => stage.level)),
      revealedStageIds: stages.map((stage) => stage.stageId),
      revealedClueIds: stages.flatMap((stage) => stage.revealsClueIds),
    }));
  }
}
