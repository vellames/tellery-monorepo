import { SupportedLanguage, t } from '@ai-history/i18n';
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

const RECENT_CONVERSATION_LIMIT = 6;
const LOCATION_VISIT_REASONING = 'Ambient clue revealed on first visit.';
const NO_CLUE_FOUND_KEY = 'interact.noClueFound';
const SESSION_NAMESPACE = 'session';

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

    const detectedIntents = await this.detectIntents(
      session.intents,
      input,
      resolvedState,
      language
    );

    let discoveredClues: InteractDiscoveredClue[] = [];
    let reply: string | null = null;
    if (resolvedState.type === 'object') {
      discoveredClues = await this.runObjectInspection(
        session,
        resolvedState.state,
        input.interaction,
        detectedIntents,
        language
      );
    } else if (resolvedState.type === 'character') {
      const characterResult = await this.runCharacterInteraction(
        session,
        resolvedState.state,
        input,
        detectedIntents,
        language
      );
      discoveredClues = characterResult.discoveredClues;
      reply = characterResult.reply;
    } else if (resolvedState.type === 'location') {
      discoveredClues = await this.runLocationVisit(resolvedState.state);
    }

    console.log('[interact] result', {
      sessionId: session.id,
      stateId: input.stateId,
      detectedIntentCount: detectedIntents.length,
      discoveredClueCount: discoveredClues.length,
      hasReply: reply !== null,
    });

    return {
      id: input.stateId,
      stateType: resolvedState.type,
      reply,
      detectedIntents,
      discoveredClues,
    };
  }

  private async detectIntents(
    intents: HistorySessionWithRelations['intents'],
    input: InteractBody,
    resolvedState: ResolvedSessionState,
    language: SupportedLanguage
  ): Promise<DetectedIntent[]> {
    if (resolvedState.type === 'location' || intents.length === 0) {
      console.log('[interact] skipping intent detection', {
        reason:
          resolvedState.type === 'location'
            ? 'location-state'
            : 'no-session-intents',
        stateType: resolvedState.type,
        intentCount: intents.length,
      });
      return [];
    }

    const detected = await this.intentDetection.detect({
      message: input.interaction,
      language,
      intents: intents.map((intent) => ({
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

  private async runObjectInspection(
    session: HistorySessionWithRelations,
    objectState: ObjectState,
    interaction: string,
    detectedIntents: DetectedIntent[],
    language: SupportedLanguage
  ): Promise<InteractDiscoveredClue[]> {
    const discoveredClueIds = session.clues
      .filter((clue) => clue.discovered)
      .map((clue) => clue.id);

    const agentResult = await this.objectAgent.run({
      object: {
        id: objectState.id,
        name: objectState.name,
        shortDescription: objectState.shortDescription,
        initialDescription: objectState.initialDescription,
      },
      rules: objectState.clueRevealRules.map((rule) => ({
        clueId: rule.clueId,
        revealText: rule.revealText,
        clueTitle: rule.clue.title,
        clueDescription: rule.clue.description,
        triggerIntentIds: rule.triggerIntents.map((intent) => intent.id),
        requiredClueIds: rule.requiredClues.map((clue) => clue.id),
      })),
      detectedIntents,
      discoveredClueIds,
      language,
    });

    const newlyDiscoveredClueIds = agentResult.map((result) => result.clueId);

    const revealTexts = newlyDiscoveredClueIds
      .map(
        (clueId) =>
          objectState.clueRevealRules.find((rule) => rule.clueId === clueId)
            ?.revealText
      )
      .filter((text): text is string => Boolean(text));

    const messages: { role: InteractionRole; content: string }[] = [
      { role: InteractionRole.user, content: interaction },
      ...revealTexts.map((content) => ({
        role: InteractionRole.object,
        content,
      })),
    ];

    if (newlyDiscoveredClueIds.length === 0) {
      messages.push({
        role: InteractionRole.system,
        content: t(language, NO_CLUE_FOUND_KEY, {}, SESSION_NAMESPACE),
      });
    }

    await this.sessions.recordObjectInspection({
      objectStateId: objectState.id,
      discoveredClueIds: newlyDiscoveredClueIds,
      messages,
    });

    return this.enrichDiscoveredClues(agentResult, session.clues);
  }

  private async runCharacterInteraction(
    session: HistorySessionWithRelations,
    characterState: CharacterState,
    input: InteractBody,
    detectedIntents: DetectedIntent[],
    language: SupportedLanguage
  ): Promise<{ reply: string; discoveredClues: InteractDiscoveredClue[] }> {
    const discoveredClueIds = session.clues
      .filter((clue) => clue.discovered)
      .map((clue) => clue.id);

    const recentConversation = characterState.messages
      .slice(-RECENT_CONVERSATION_LIMIT)
      .map((message) => ({
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
      conversationSummary: characterState.conversationSummary,
      recentConversation,
      interaction: input.interaction,
      detectedIntents,
      discoveredClueIds,
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
      { role: InteractionRole.user, content: input.interaction },
      { role: InteractionRole.character, content: agentResult.reply },
    ];

    if (newlyDiscoveredClueIds.length === 0) {
      messages.push({
        role: InteractionRole.system,
        content: t(language, NO_CLUE_FOUND_KEY, {}, SESSION_NAMESPACE),
      });
    }

    await this.sessions.recordCharacterInteraction({
      characterStateId: characterState.id,
      conversationSummary: agentResult.updatedConversationSummary,
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
