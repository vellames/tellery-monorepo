import { HealthController } from "../controllers/health.controller";
import { SessionController } from "../controllers/session.controller";
import {
  HistoryRepository,
  HistorySessionRepository,
  UserRepository,
} from "../repositories";
import { HistorySessionService } from "../services/session/history-session.service";
import { SessionInteractionService } from "../services/session/session-interaction.service";

export class DIContainer {
  private static instance: DIContainer;

  private readonly users = new UserRepository();
  private readonly histories = new HistoryRepository();
  private readonly sessions = new HistorySessionRepository();

  private readonly healthController = new HealthController();
  private readonly historySessionService = new HistorySessionService(
    this.users,
    this.histories,
    this.sessions
  );
  private readonly sessionInteractionService = new SessionInteractionService(
    this.histories,
    this.sessions
  );
  private readonly sessionController = new SessionController(
    this.historySessionService,
    this.sessionInteractionService
  );

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }

    return DIContainer.instance;
  }

  getHealthController(): HealthController {
    return this.healthController;
  }

  getSessionController(): SessionController {
    return this.sessionController;
  }
}
