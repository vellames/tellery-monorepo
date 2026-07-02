import { SupportedLanguage } from '@ai-history/i18n';
import { InteractionRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { CharacterAgent } from '../../engine/character/character-agent.service';
import {
  DetectedIntent,
  IntentDetectionService,
} from '../../engine/intent/intent-detection.service';
import {
  ObjectAgent,
  ObjectAgentDiscoveredClue,
} from '../../engine/object/object-agent.service';
import { ISessionRepository } from '../../interfaces';
import type { HistorySessionWithRelations } from '../../repositories/SessionRepository';
import { InteractBody } from '../../types/http/session.validation';
import { HttpError } from '../../utils/http-error';
import {
  ResolvedSessionState,
  resolveSessionState,
} from './session-state-resolver';

export type SessionStateType = ResolvedSessionState['type'];

type ObjectState = HistorySessionWithRelations['objectStates'][number];
type CharacterState = HistorySessionWithRelations['characterStates'][number];
type LocationState = HistorySessionWithRelations['locationStates'][number];

const LOCATION_VISIT_REASONING = 'Ambient clue revealed on first visit.';
const OFF_TOPIC_INTENT_ID = 'off_topic';

export interface InteractDiscoveredClue {
  id: string;
  title: string;
  description: string;
  reasoning: string;
}

export interface InteractResult {
  id: string;
  stateType: SessionStateType;
  reply: string | null;
  detectedIntents: DetectedIntent[];
  discoveredClues: InteractDiscoveredClue[];
}

export class SessionInteractionService {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly intentDetection: IntentDetectionService,
    private readonly objectAgent: ObjectAgent,
    private readonly characterAgent: CharacterAgent
  ) {}

  async interact(
    sessionId: string,
    userId: string,
    input: InteractBody,
    language: SupportedLanguage
  ): Promise<InteractResult> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        sessionId,
        'session:errors.unknownSession'
      );
    }

    if (session.userId !== userId) {
      throw new HttpError(
        StatusCodes.FORBIDDEN,
        sessionId,
        'session:errors.sessionNotOwned'
      );
    }

    const resolvedState = resolveSessionState(session, input.stateId);
    if (!resolvedState) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        input.stateId,
        'session:errors.unknownSessionState'
      );
    }

    console.log('[interact] resolved state', {
      sessionId: session.id,
      stateId: input.stateId,
      stateType: resolvedState.type,
      intentCount: session.intents.length,
      language,
    });

    const result = await this.resolveInteraction(
      session,
      resolvedState,
      input,
      language
    );

    console.log('[interact] result', {
      sessionId: session.id,
      stateId: input.stateId,
      detectedIntentCount: result.detectedIntents.length,
      discoveredClueCount: result.discoveredClues.length,
      hasReply: result.reply !== null,
    });

    const intentDescriptionById = new Map(
      session.intents.map((intent) => [intent.id, intent.description])
    );

    return {
      id: input.stateId,
      stateType: resolvedState.type,
      reply: result.reply,
      detectedIntents: result.detectedIntents.map((detected) => ({
        ...detected,
        description: intentDescriptionById.get(detected.intentId),
      })),
      discoveredClues: result.discoveredClues,
    };
  }

  private async resolveInteraction(
    session: HistorySessionWithRelations,
    resolvedState: ResolvedSessionState,
    input: InteractBody,
    language: SupportedLanguage
  ): Promise<{
    reply: string | null;
    discoveredClues: InteractDiscoveredClue[];
    detectedIntents: DetectedIntent[];
  }> {
    switch (resolvedState.type) {
      case 'character':
        return this.resolveCharacterState(
          session,
          resolvedState.state,
          input,
          language
        );
      case 'object':
        return this.resolveObjectState(session, resolvedState.state);
      case 'location':
        return this.resolveLocationState(resolvedState.state);
    }
  }

  private async resolveCharacterState(
    session: HistorySessionWithRelations,
    characterState: CharacterState,
    input: InteractBody,
    language: SupportedLanguage
  ): Promise<{
    reply: string | null;
    discoveredClues: InteractDiscoveredClue[];
    detectedIntents: DetectedIntent[];
  }> {
    const detectedIntents = await this.detectIntents(
      session.intents,
      input,
      characterState,
      language,
      session.id
    );
    const { reply, discoveredClues } = await this.runCharacterInteraction(
      session,
      characterState,
      input,
      detectedIntents,
      language
    );
    return { reply, discoveredClues, detectedIntents };
  }

  private async resolveObjectState(
    session: HistorySessionWithRelations,
    objectState: ObjectState
  ): Promise<{
    reply: string | null;
    discoveredClues: InteractDiscoveredClue[];
    detectedIntents: DetectedIntent[];
  }> {
    const discoveredClues = await this.runObjectInspection(
      session,
      objectState
    );
    return { reply: null, discoveredClues, detectedIntents: [] };
  }

  private async resolveLocationState(locationState: LocationState): Promise<{
    reply: string | null;
    discoveredClues: InteractDiscoveredClue[];
    detectedIntents: DetectedIntent[];
  }> {
    const discoveredClues = await this.runLocationVisit(locationState);
    return { reply: null, discoveredClues, detectedIntents: [] };
  }

  private async detectIntents(
    intents: HistorySessionWithRelations['intents'],
    input: InteractBody,
    characterState: CharacterState,
    language: SupportedLanguage,
    sessionId: string
  ): Promise<DetectedIntent[]> {
    if (intents.length === 0) {
      console.log('[interact] skipping intent detection', {
        reason: 'no-session-intents',
        intentCount: intents.length,
      });
      return [];
    }

    const scopedIntents = this.resolveRelevantIntents(intents, characterState);

    if (scopedIntents.length === 0) {
      console.log('[interact] no relevant intents for character', {
        total: intents.length,
      });
      return [];
    }

    console.log('[interact] scoped intents', {
      total: intents.length,
      scoped: scopedIntents.length,
    });

    const detected = await this.intentDetection.detect({
      message: input.interaction,
      language,
      sessionId,
      intents: scopedIntents.map((intent) => ({
        id: intent.id,
        description: intent.description,
        examples: intent.examples,
        keywords: intent.keywords,
      })),
    });

    console.log('[interact] detected intents', {
      count: detected.length,
      detected,
    });

    return detected;
  }

  private resolveRelevantIntents(
    allIntents: HistorySessionWithRelations['intents'],
    characterState: CharacterState
  ): HistorySessionWithRelations['intents'] {
    const relevantIntentIds = new Set<string>([OFF_TOPIC_INTENT_ID]);

    for (const rule of characterState.clueRevealRules) {
      if (rule.clue.discovered) continue;
      for (const intent of rule.triggerIntents) {
        relevantIntentIds.add(intent.id);
      }
    }

    for (const secret of characterState.secrets) {
      for (const stage of secret.revealStages) {
        if (stage.level < secret.currentStageLevel) continue;
        for (const intent of stage.triggerIntents) {
          relevantIntentIds.add(intent.id);
        }
      }
    }

    return allIntents.filter((intent) => relevantIntentIds.has(intent.id));
  }

  private async runObjectInspection(
    session: HistorySessionWithRelations,
    objectState: ObjectState
  ): Promise<InteractDiscoveredClue[]> {
    const alreadyDiscovered = new Set(
      session.clues.filter((c) => c.discovered).map((c) => c.id)
    );

    const newlyDiscoveredClueIds: string[] = [];
    const revealTexts: string[] = [];

    for (const rule of objectState.clueRevealRules) {
      if (alreadyDiscovered.has(rule.clueId)) continue;

      newlyDiscoveredClueIds.push(rule.clueId);
      if (rule.revealText) revealTexts.push(rule.revealText);
    }

    const messages: { role: InteractionRole; content: string }[] = [
      ...revealTexts.map((content) => ({
        role: InteractionRole.object,
        content,
      })),
    ];

    await this.sessions.recordObjectInspection({
      objectStateId: objectState.id,
      discoveredClueIds: newlyDiscoveredClueIds,
      messages,
    });

    return newlyDiscoveredClueIds.map((clueId) => {
      const rule = objectState.clueRevealRules.find((r) => r.clueId === clueId);
      const clue = session.clues.find((c) => c.id === clueId);
      return {
        id: clueId,
        title: clue?.title ?? rule?.clue.title ?? '',
        description: clue?.description ?? rule?.clue.description ?? '',
        reasoning: rule?.revealText ?? 'Object inspected.',
      };
    });
  }

  private async runCharacterInteraction(
    session: HistorySessionWithRelations,
    characterState: CharacterState,
    input: InteractBody,
    detectedIntents: DetectedIntent[],
    language: SupportedLanguage
  ): Promise<{ reply: string; discoveredClues: InteractDiscoveredClue[] }> {
    const discoveredClues = session.clues
      .filter((clue) => clue.discovered)
      .map((clue) => ({ id: clue.id, title: clue.title }));

    const recentConversation = characterState.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const agentResult = await this.characterAgent.run({
      character: {
        id: characterState.id,
        name: characterState.name,
        role: characterState.role,
        shortDescription: characterState.shortDescription,
        personality: characterState.personality,
        speakingStyle: characterState.speakingStyle,
        publicKnowledge: characterState.publicKnowledge,
        privateKnowledge: characterState.privateKnowledge,
        openingLine: characterState.openingLine,
        conversationBoundaries: characterState.conversationBoundaries,
      },
      recentConversation,
      interaction: input.interaction,
      detectedIntents,
      discoveredClues,
      sessionId: session.id,
      clueRules: characterState.clueRevealRules.map((rule) => ({
        clueId: rule.clueId,
        revealText: rule.revealText,
        clueTitle: rule.clue.title,
        clueDescription: rule.clue.description,
        triggerIntentIds: rule.triggerIntents.map((intent) => intent.id),
        requiredClueIds: rule.requiredClues.map((clue) => clue.id),
      })),
      secrets: characterState.secrets.map((secret) => ({
        secretId: secret.id,
        currentStageLevel: secret.currentStageLevel,
        summary: secret.summary,
        truth: secret.truth,
        defaultStrategy: secret.defaultStrategy,
        stages: secret.revealStages.map((stage) => ({
          stageId: stage.id,
          level: stage.level,
          behavior: stage.behavior,
          allowedToRevealTruth: stage.allowedToRevealTruth,
          sampleResponses: stage.sampleResponses,
          triggerIntentIds: stage.triggerIntents.map((intent) => intent.id),
          requiredClueIds: stage.requiredClues.map((clue) => clue.id),
          revealsClueIds: stage.revealsClues.map((clue) => clue.id),
        })),
      })),
      language,
    });

    const newlyDiscoveredClueIds = agentResult.discoveredClues.map(
      (result) => result.clueId
    );

    const messages: { role: InteractionRole; content: string }[] = [
      ...agentResult.systemMessages.map((content) => ({
        role: InteractionRole.system,
        content,
      })),
      { role: InteractionRole.user, content: input.interaction },
      { role: InteractionRole.character, content: agentResult.reply },
    ];

    await this.sessions.recordCharacterInteraction({
      characterStateId: characterState.id,
      discoveredClueIds: newlyDiscoveredClueIds,
      updatedSecretStates: agentResult.updatedSecretStates,
      messages,
    });

    return {
      reply: agentResult.reply,
      discoveredClues: this.enrichDiscoveredClues(
        agentResult.discoveredClues,
        session.clues
      ),
    };
  }

  private enrichDiscoveredClues(
    agentResult: ObjectAgentDiscoveredClue[],
    clues: HistorySessionWithRelations['clues']
  ): InteractDiscoveredClue[] {
    return agentResult.map((discovered) => {
      const clue = clues.find((entry) => entry.id === discovered.clueId);

      return {
        id: discovered.clueId,
        title: clue?.title ?? '',
        description: clue?.description ?? '',
        reasoning: discovered.reasoning,
      };
    });
  }

  private async runLocationVisit(
    locationState: LocationState
  ): Promise<InteractDiscoveredClue[]> {
    if (locationState.visited) {
      return [];
    }

    const ambientClueIds = locationState.ambientClues.map((clue) => clue.id);
    const newlyDiscovered = locationState.ambientClues.filter(
      (clue) => !clue.discovered
    );

    await this.sessions.recordLocationVisit({
      locationStateId: locationState.id,
      revealedAmbientClueIds: ambientClueIds,
      discoveredClueIds: newlyDiscovered.map((clue) => clue.id),
    });

    return newlyDiscovered.map((clue) => ({
      id: clue.id,
      title: clue.title,
      description: clue.description,
      reasoning: LOCATION_VISIT_REASONING,
    }));
  }
}
