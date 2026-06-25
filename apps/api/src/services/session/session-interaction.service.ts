import { SupportedLanguage } from '@ai-history/i18n';
import { StatusCodes } from 'http-status-codes';
import { DetectedIntent, IntentDetectionService } from '../../engine/intent/intent-detection.service';
import { ISessionRepository } from '../../interfaces';
import type { HistorySessionWithRelations } from '../../repositories/SessionRepository';
import { InteractBody } from '../../types/http/session.validation';
import { HttpError } from '../../utils/http-error';
import { ResolvedSessionState, resolveSessionState } from './session-state-resolver';

export type SessionStateType = ResolvedSessionState['type'];

export interface InteractResult {
  id: string;
  stateType: SessionStateType;
  detectedIntents: DetectedIntent[];
}

export class SessionInteractionService {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly intentDetection: IntentDetectionService
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

    console.log('[interact] detected intents', {
      sessionId: session.id,
      stateId: input.stateId,
      count: detectedIntents.length,
      detectedIntents,
    });

    return {
      id: input.stateId,
      stateType: resolvedState.type,
      detectedIntents,
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

    return this.intentDetection.detect({
      message: input.interaction,
      language,
      intents: intents.map((intent) => ({
        id: intent.id,
        description: intent.description,
        examples: intent.examples,
        keywords: intent.keywords,
      })),
    });
  }
}
