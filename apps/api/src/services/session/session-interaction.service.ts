import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '../../interfaces';
import { InteractBody } from '../../types/http/session.validation';
import { HttpError } from '../../utils/http-error';
import { ResolvedSessionState, resolveSessionState } from './session-state-resolver';

export type SessionStateType = ResolvedSessionState['type'];

export interface InteractResult {
  id: string;
  stateType: SessionStateType;
}

export class SessionInteractionService {
  constructor(private readonly sessions: ISessionRepository) {}

  async interact(
    sessionId: string,
    userId: string,
    input: InteractBody
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

    return {
      id: input.stateId,
      stateType: resolvedState.type,
    };
  }
}
