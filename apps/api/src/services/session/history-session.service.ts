import {
  IHistoryRepository,
  IHistorySessionRepository,
  IUserRepository,
} from '../../interfaces';
import { HttpError } from '../../utils/http-error';
import { StartSessionBody } from '../../types/http/session.validation';

export class HistorySessionService {
  constructor(
    private readonly users: IUserRepository,
    private readonly histories: IHistoryRepository,
    private readonly sessions: IHistorySessionRepository
  ) {}

  async startSession(input: StartSessionBody) {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new HttpError(404, input.userId, 'user:errors.unknownUser');
    }

    const history =
      (input.historyId
        ? this.histories.findById(input.historyId)
        : undefined) ??
      (input.historySlug
        ? this.histories.findBySlug(input.historySlug)
        : undefined) ??
      this.histories.findDefault();

    if (!history) {
      throw new HttpError(404, '', 'session:errors.noHistoryAvailable');
    }

    const session = this.sessions.create({
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
}
