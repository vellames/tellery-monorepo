import { PrismaClient } from '@prisma/client';
import { appConfig } from '../config/app.config';
import { HealthController } from '../controllers/health.controller';
import { SessionController } from '../controllers/session.controller';
import { UserController } from '../controllers/user/user.controller';
import {
  IHistoryDefinitionRepository,
  IHistoryRepository,
  IHistorySessionRepository,
  ISessionRepository,
  IPasswordHasher,
  ITokenService,
  IUserRepository,
} from '../interfaces';
import {
  HistoryDefinitionRepository,
  HistoryRepository,
  HistorySessionRepository,
  SessionRepository,
  UserRepository,
} from '../repositories';
import { HistorySessionService } from '../services/session/history-session.service';
import { SessionInteractionService } from '../services/session/session-interaction.service';
import { BcryptPasswordHasher } from '../services/user/bcrypt-password-hasher';
import { JwtTokenService } from '../services/user/jwt-token.service';
import { UserService } from '../services/user/user.service';

export class DIContainer {
  private static instance: DIContainer;

  private readonly prisma = new PrismaClient();

  private readonly userRepository: IUserRepository = new UserRepository(
    this.prisma
  );
  private readonly historyRepository: IHistoryRepository =
    new HistoryRepository();
  private readonly historySessionRepository: IHistorySessionRepository =
    new HistorySessionRepository();
  private readonly historyDefinitionRepository: IHistoryDefinitionRepository =
    new HistoryDefinitionRepository(this.prisma);
  private readonly sessionRepository: ISessionRepository =
    new SessionRepository(this.prisma);

  private readonly healthController = new HealthController(this.prisma);
  private readonly passwordHasher: IPasswordHasher = new BcryptPasswordHasher(
    appConfig.security.bcryptSaltRounds
  );
  private readonly tokenService: ITokenService = new JwtTokenService(
    appConfig.security.jwtSecret,
    appConfig.security.jwtExpiresIn
  );
  private readonly userService = new UserService(
    this.userRepository,
    this.passwordHasher,
    this.tokenService
  );
  private readonly userController = new UserController(this.userService);
  private readonly historySessionService = new HistorySessionService(
    this.userRepository,
    this.historyDefinitionRepository,
    this.sessionRepository
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

  getUserController(): UserController {
    return this.userController;
  }

  getPrisma(): PrismaClient {
    return this.prisma;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
