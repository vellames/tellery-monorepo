import { SupportedLanguage } from '@ai-history/i18n';
import { z } from 'zod';
import { DetectedIntent } from '../intent/intent-detection.service';
import {
  ChatMessage,
  IStructuredChatModel,
} from '../llm/structured-chat-model.interface';

const SYSTEM_PROMPT_KEY = 'objectAgentSystemPrompt';
const USER_PROMPT_KEY = 'objectAgentUserPrompt';
const ENFORCEMENT_REASONING =
  'Automatically included because the object reveal rule was eligible for this interaction.';

export interface ObjectAgentObject {
  id: string;
  name: string;
  shortDescription: string;
  initialDescription: string;
}

export interface ObjectAgentRule {
  clueId: string;
  revealText: string;
  clueTitle: string;
  clueDescription: string;
  triggerIntentIds: string[];
  requiredClueIds: string[];
}

export interface RunObjectAgentInput {
  object: ObjectAgentObject;
  rules: ObjectAgentRule[];
  detectedIntents: DetectedIntent[];
  discoveredClueIds: string[];
  language: SupportedLanguage;
  sessionId?: string;
}

export interface ObjectAgentDiscoveredClue {
  clueId: string;
  reasoning: string;
}

export type ObjectTranslationFn = (
  language: SupportedLanguage,
  key: string,
  params?: Record<string, string>
) => string;

const ObjectAgentResponseSchema = z.array(
  z.object({
    clueId: z.string(),
    reasoning: z.string(),
  })
);

type ObjectAgentResponse = z.infer<typeof ObjectAgentResponseSchema>;

export class ObjectAgent {
  constructor(
    private readonly llm: IStructuredChatModel,
    private readonly translate: ObjectTranslationFn
  ) {}

  async run(input: RunObjectAgentInput): Promise<ObjectAgentDiscoveredClue[]> {
    const eligibleRules = this.getEligibleRules(
      input.rules,
      input.detectedIntents,
      input.discoveredClueIds
    );

    if (eligibleRules.length === 0) {
      console.log('[object-agent] no eligible rules, skipping llm', {
        objectId: input.object.id,
        ruleCount: input.rules.length,
      });
      return [];
    }

    const response = await this.llm.invokeStructured(
      this.buildMessages(input, eligibleRules),
      ObjectAgentResponseSchema,
      { sessionId: input.sessionId }
    );

    console.log('[object-agent] raw llm response', {
      objectId: input.object.id,
      eligibleCount: eligibleRules.length,
      response,
    });

    const result = this.normalize(response, eligibleRules);

    console.log('[object-agent] discovered clues', {
      objectId: input.object.id,
      discovered: result,
    });

    return result;
  }

  private getEligibleRules(
    rules: ObjectAgentRule[],
    detectedIntents: DetectedIntent[],
    discoveredClueIds: string[]
  ): ObjectAgentRule[] {
    const detectedIntentIds = new Set(
      detectedIntents.map((detectedIntent) => detectedIntent.intentId)
    );
    const discoveredClues = new Set(discoveredClueIds);

    return rules.filter((rule) => {
      const hasTriggerIntent = rule.triggerIntentIds.some((intentId) =>
        detectedIntentIds.has(intentId)
      );
      const hasRequiredClues = rule.requiredClueIds.every((clueId) =>
        discoveredClues.has(clueId)
      );

      return (
        hasTriggerIntent &&
        hasRequiredClues &&
        !discoveredClues.has(rule.clueId)
      );
    });
  }

  private buildMessages(
    input: RunObjectAgentInput,
    eligibleRules: ObjectAgentRule[]
  ): ChatMessage[] {
    return [
      {
        role: 'system',
        content: this.translate(input.language, SYSTEM_PROMPT_KEY),
      },
      {
        role: 'user',
        content: this.translate(input.language, USER_PROMPT_KEY, {
          object: JSON.stringify(
            {
              id: input.object.id,
              name: input.object.name,
              shortDescription: input.object.shortDescription,
              initialDescription: input.object.initialDescription,
            },
            null,
            2
          ),
          detectedIntents: JSON.stringify(input.detectedIntents, null, 2),
          discoveredClueIds: JSON.stringify(input.discoveredClueIds),
          eligibleRules: JSON.stringify(
            eligibleRules.map((rule) => ({
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
        }),
      },
    ];
  }

  private normalize(
    response: ObjectAgentResponse,
    eligibleRules: ObjectAgentRule[]
  ): ObjectAgentDiscoveredClue[] {
    const eligibleClueIds = eligibleRules.map((rule) => rule.clueId);
    const eligibleClueIdSet = new Set(eligibleClueIds);

    const fromModel = response.filter((result) =>
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
}
