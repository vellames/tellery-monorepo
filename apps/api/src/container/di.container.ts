import { HealthController } from "../controllers/health.controller";
import { SessionController } from "../controllers/session.controller";
import {
  IHistoryRepository,
  IHistorySessionRepository,
  IUserRepository,
} from "../interfaces";
import {
  HistoryRepository,
  HistorySessionRepository,
  UserRepository,
} from "../repositories";
import { HistorySessionService } from "../services/session/history-session.service";
import { SessionInteractionService } from "../services/session/session-interaction.service";

export class DIContainer {
  private static instance: DIContainer;

  private readonly userRepository: IUserRepository = new UserRepository();
  private readonly historyRepository: IHistoryRepository =
    new HistoryRepository();
  private readonly historySessionRepository: IHistorySessionRepository =
    new HistorySessionRepository();

  private readonly healthController = new HealthController();
  private readonly historySessionService = new HistorySessionService(
    this.userRepository,
    this.historyRepository,
    this.historySessionRepository
  );
  private readonly sessionInteractionService = new SessionInteractionService(
    this.historyRepository,
    this.historySessionRepository
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
