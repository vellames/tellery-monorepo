import { SupportedLanguage } from '@ai-history/i18n';
import { StatusCodes } from 'http-status-codes';
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
import { ResolvedSessionState, resolveSessionState } from './session-state-resolver';

export type SessionStateType = ResolvedSessionState['type'];

type ObjectState = HistorySessionWithRelations['objectStates'][number];

export interface InteractDiscoveredClue {
  id: string;
  title: string;
  description: string;
  reasoning: string;
}

export interface InteractResult {
  id: string;
  stateType: SessionStateType;
  detectedIntents: DetectedIntent[];
  discoveredClues: InteractDiscoveredClue[];
}

export class SessionInteractionService {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly intentDetection: IntentDetectionService,
    private readonly objectAgent: ObjectAgent
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
    if (resolvedState.type === 'object') {
      discoveredClues = await this.runObjectInspection(
        session,
        resolvedState.state,
        detectedIntents,
        language
      );
    }

    console.log('[interact] result', {
      sessionId: session.id,
      stateId: input.stateId,
      detectedIntentCount: detectedIntents.length,
      discoveredClueCount: discoveredClues.length,
    });

    return {
      id: input.stateId,
      stateType: resolvedState.type,
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

    await this.sessions.recordObjectInspection({
      objectStateId: objectState.id,
      discoveredClueIds: newlyDiscoveredClueIds,
    });

    return this.enrichDiscoveredClues(agentResult, session.clues);
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
}
