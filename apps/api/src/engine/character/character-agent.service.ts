import { SupportedLanguage } from '@ai-history/i18n';
import { DetectedIntent } from '../intent/intent-detection.service';
import {
  ChatMessage,
  IStructuredChatModel,
} from '../llm/structured-chat-model.interface';

const SYSTEM_PROMPT_KEY = 'characterAgentSystemPrompt';
const TURN_STATE_PROMPT_KEY = 'characterAgentTurnStatePrompt';
const ELIGIBLE_REVEAL_REASONING =
  'Revealed by an eligible clue rule or secret stage for this interaction.';

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

export interface DiscoveredClueSummary {
  id: string;
  title: string;
}

export interface RunCharacterAgentInput {
  character: CharacterAgentCharacter;
  recentConversation: ConversationMessage[];
  interaction: string;
  detectedIntents: DetectedIntent[];
  discoveredClues: DiscoveredClueSummary[];
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
  updatedSecretStates: UpdatedSecretState[];
  systemMessages: string[];
}

export type CharacterTranslationFn = (
  language: SupportedLanguage,
  key: string,
  params?: Record<string, string>
) => string;

export class CharacterAgent {
  constructor(
    private readonly llm: IStructuredChatModel,
    private readonly translate: CharacterTranslationFn
  ) {}

  async run(input: RunCharacterAgentInput): Promise<CharacterAgentResult> {
    const discoveredClueIds = input.discoveredClues.map((clue) => clue.id);
    const eligibleClueRules = this.getEligibleClueRules(
      input.clueRules,
      input.detectedIntents,
      discoveredClueIds
    );
    const eligibleSecretStages = this.getEligibleSecretStages(
      input.secrets,
      input.detectedIntents,
      discoveredClueIds
    );

    const { messages, currentSystemMessages } = this.buildMessages(
      input,
      eligibleClueRules,
      eligibleSecretStages
    );

    console.log('[character-agent] messages sent to LLM', {
      characterId: input.character.id,
      eligibleClueRuleCount: eligibleClueRules.length,
      eligibleSecretStageCount: eligibleSecretStages.length,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const reply = await this.llm.invoke(messages);

    console.log('[character-agent] raw llm response', {
      characterId: input.character.id,
      eligibleClueRuleCount: eligibleClueRules.length,
      eligibleSecretStageCount: eligibleSecretStages.length,
      replyLength: reply.length,
    });

    const discoveredClues = this.collectDiscoveredClues(
      eligibleClueRules,
      eligibleSecretStages
    );
    const updatedSecretStates =
      this.computeUpdatedSecretStates(eligibleSecretStages);

    console.log('[character-agent] result', {
      characterId: input.character.id,
      discoveredClueCount: discoveredClues.length,
      advancedSecretCount: updatedSecretStates.length,
    });

    return {
      reply,
      discoveredClues,
      updatedSecretStates,
      systemMessages: currentSystemMessages,
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
  ): { messages: ChatMessage[]; currentSystemMessages: string[] } {
    const history = this.toChatHistory(input.recentConversation);
    const shouldSendBasePrompt = !history.some(
      (message) => message.role === 'system' && this.isBasePrompt(message.content)
    );
    const baseSystemMessage: ChatMessage = {
      role: 'system',
      content: this.translate(input.language, SYSTEM_PROMPT_KEY, {
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
        secretBaselines: JSON.stringify(
          input.secrets.map((secret) => ({
            secretId: secret.secretId,
            summary: secret.summary,
            defaultStrategy: secret.defaultStrategy,
          })),
          null,
          2
        ),
      }),
    };
    const turnSystemMessage: ChatMessage = {
      role: 'system',
      content: this.translate(input.language, TURN_STATE_PROMPT_KEY, {
        discoveredClues: JSON.stringify(
          input.discoveredClues.map((clue) => clue.title)
        ),
        currentProgress: JSON.stringify(
          input.secrets.map((secret) => ({
            secretId: secret.secretId,
            currentStageLevel: secret.currentStageLevel,
          })),
          null,
          2
        ),
        turnReveals: JSON.stringify(
          {
            clueReveals: eligibleClueRules.map((rule) => ({
              clue: rule.clueTitle,
              reveal: rule.revealText,
            })),
            secretAdvances: eligibleSecretStages.map(({ secret, stage }) => ({
              secretId: secret.secretId,
              advanceToLevel: stage.level,
              behavior: stage.behavior,
              allowedToRevealTruth: stage.allowedToRevealTruth,
              ...(stage.allowedToRevealTruth ? { truth: secret.truth } : {}),
              sampleResponses: stage.sampleResponses,
            })),
          },
          null,
          2
        ),
      }),
    };
    const currentSystemMessages = [
      ...(shouldSendBasePrompt ? [baseSystemMessage.content] : []),
      turnSystemMessage.content,
    ];

    return {
      messages: [
        ...(shouldSendBasePrompt ? [baseSystemMessage] : []),
        ...history,
        turnSystemMessage,
        { role: 'user', content: input.interaction },
      ],
      currentSystemMessages,
    };
  }

  private isBasePrompt(content: string): boolean {
    return (
      content.includes('Baseline dos segredos') ||
      content.includes('Secrets baseline')
    );
  }

  private toChatHistory(messages: ConversationMessage[]): ChatMessage[] {
    return messages.map((message) => ({
      role: this.toChatRole(message.role),
      content: message.content,
    }));
  }

  private toChatRole(role: string): ChatMessage['role'] {
    if (role === 'system') return 'system';
    if (role === 'user') return 'user';

    return 'assistant';
  }

  private collectDiscoveredClues(
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

    const seen = new Set<string>();
    return eligibleClueIds
      .filter((clueId) => {
        if (seen.has(clueId)) return false;
        seen.add(clueId);
        return true;
      })
      .map((clueId) => ({
        clueId,
        reasoning: ELIGIBLE_REVEAL_REASONING,
      }));
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
