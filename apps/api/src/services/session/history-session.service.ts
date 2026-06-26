import {
  IHistoryDefinitionRepository,
  ISessionRepository,
  IUserRepository,
} from '../../interfaces';
import { HttpError } from '../../utils/http-error';
import { StartSessionBody } from '../../types/http/session.validation';
import { StatusCodes } from 'http-status-codes';
import {
  buildSessionStateResponse,
  SessionStateResponse,
} from './session-state.mapper';

export class HistorySessionService {
  constructor(
    private readonly users: IUserRepository,
    private readonly histories: IHistoryDefinitionRepository,
    private readonly sessions: ISessionRepository
  ) {}

  async startSession(userId: string, input: StartSessionBody) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        userId,
        'user:errors.unknownUser'
      );
    }

    const history =
      (input.historyId
        ? await this.histories.findById(input.historyId)
        : null) ??
      (input.historySlug
        ? await this.histories.findBySlug(input.historySlug)
        : null);

    if (!history) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        input.historyId ?? input.historySlug ?? '',
        'session:errors.unknownHistory'
      );
    }

    const session = await this.sessions.create({
      userId: user.id,
      history,
    });

    return {
      session,
      sessionStatus: session.status,
      history: {
        id: history.id,
        slug: history.slug,
        title: history.title,
        subtitle: history.subtitle ?? null,
        opening: history.opening,
        objective: history.objective,
      },
    };
  }

  async getSessionState(
    sessionId: string,
    userId: string
  ): Promise<SessionStateResponse> {
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

    return buildSessionStateResponse(session);
  }
}
