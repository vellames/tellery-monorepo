import {
  HistoryRepository,
  HistorySessionRepository,
  UserRepository,
} from "../../repositories";
import { HttpError } from "../../utils/http-error";
import { StartSessionBody } from "../../types/http/session.validation";

export class HistorySessionService {
  constructor(
    private readonly users: UserRepository,
    private readonly histories: HistoryRepository,
    private readonly sessions: HistorySessionRepository
  ) {}

  startSession(input: StartSessionBody) {
    const user = this.users.findById(input.userId);
    if (!user) {
      throw new HttpError(404, `Unknown userId: ${input.userId}`);
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
      throw new HttpError(404, "No history available to start");
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
