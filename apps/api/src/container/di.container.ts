import { PrismaClient } from '@prisma/client';
import { S3Client } from '@aws-sdk/client-s3';
import { t } from '@ai-history/i18n';
import { appConfig } from '../config/app.config';
import { HealthController } from '../controllers/health.controller';
import { HistoryController } from '../controllers/history.controller';
import { SessionController } from '../controllers/session.controller';
import { UserController } from '../controllers/user/user.controller';
import { CharacterAgent } from '../engine/character/character-agent.service';
import { IntentDetectionService } from '../engine/intent/intent-detection.service';
import { ObjectAgent } from '../engine/object/object-agent.service';
import { OpenRouterStructuredChatModel } from '../engine/llm/openrouter-structured-chat-model';
import {
  IHistoryDefinitionRepository,
  IImageUrlSigner,
  ISessionRepository,
  IPasswordHasher,
  ITokenService,
  IUserRepository,
  IAudioStorage,
  IAudioTranscriptionService,
} from '../interfaces';
import {
  HistoryDefinitionRepository,
  SessionRepository,
  UserRepository,
} from '../repositories';
import { HistorySessionService } from '../services/session/history-session.service';
import { SessionInteractionService } from '../services/session/session-interaction.service';
import { SessionConclusionService } from '../services/session/session-conclusion.service';
import { HistoryCatalogService } from '../services/history/history-catalog.service';
import { S3ImageUrlSigner } from '../services/image/s3-image-url-signer';
import { S3AudioStorage } from '../services/audio/s3-audio-storage';
import { OpenRouterAudioTranscriptionService } from '../services/audio/openrouter-audio-transcription.service';
import { BcryptPasswordHasher } from '../services/user/bcrypt-password-hasher';
import { JwtTokenService } from '../services/user/jwt-token.service';
import { UserService } from '../services/user/user.service';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { createSessionOwnershipMiddleware } from '../middleware/session-ownership.middleware';
import type { RequestHandler } from 'express';

export class DIContainer {
  private static instance: DIContainer;

  private readonly prisma = new PrismaClient();

  private readonly userRepository: IUserRepository = new UserRepository(
    this.prisma
  );
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
  private readonly authMiddleware: RequestHandler = createAuthMiddleware(
    this.tokenService
  );
  private readonly sessionOwnershipMiddleware: RequestHandler =
    createSessionOwnershipMiddleware(this.sessionRepository);
  private readonly userService = new UserService(
    this.userRepository,
    this.passwordHasher,
    this.tokenService
  );
  private readonly userController = new UserController(this.userService);
  private readonly s3Client = new S3Client({
    region: appConfig.aws.region,
    credentials: appConfig.aws.accessKeyId
      ? {
          accessKeyId: appConfig.aws.accessKeyId,
          secretAccessKey: appConfig.aws.secretAccessKey as string,
        }
      : undefined,
  });
  private readonly imageUrlSigner: IImageUrlSigner = new S3ImageUrlSigner(
    this.s3Client,
    appConfig.aws.s3Bucket as string,
    appConfig.aws.presignedExpirationSeconds
  );
  private readonly historySessionService = new HistorySessionService(
    this.userRepository,
    this.historyDefinitionRepository,
    this.sessionRepository,
    this.imageUrlSigner
  );
  private readonly intentDetectionService = new IntentDetectionService(
    new OpenRouterStructuredChatModel(appConfig.openrouter.intentDetectorModel),
    appConfig.openrouter.intentDetectorThreshold,
    t
  );
  private readonly objectAgent = new ObjectAgent(
    new OpenRouterStructuredChatModel(appConfig.openrouter.objectAgentModel),
    t
  );
  private readonly characterAgent = new CharacterAgent(
    new OpenRouterStructuredChatModel(
      appConfig.openrouter.characterAgentModel,
      appConfig.openrouter.reasoningEffort
    ),
    t
  );
  private readonly sessionInteractionService = new SessionInteractionService(
    this.sessionRepository,
    this.intentDetectionService,
    this.objectAgent,
    this.characterAgent
  );
  private readonly sessionConclusionService = new SessionConclusionService(
    this.sessionRepository
  );
  private readonly audioStorage: IAudioStorage = new S3AudioStorage(
    this.s3Client,
    appConfig.aws.s3Bucket as string
  );
  private readonly audioTranscription: IAudioTranscriptionService =
    new OpenRouterAudioTranscriptionService();
  private readonly sessionController = new SessionController(
    this.historySessionService,
    this.sessionInteractionService,
    this.sessionConclusionService,
    this.audioStorage,
    this.audioTranscription
  );
  private readonly historyCatalogService = new HistoryCatalogService(
    this.historyDefinitionRepository,
    this.imageUrlSigner
  );
  private readonly historyController = new HistoryController(
    this.historyCatalogService
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

  getHistoryController(): HistoryController {
    return this.historyController;
  }

  getUserController(): UserController {
    return this.userController;
  }

  getAuthMiddleware(): RequestHandler {
    return this.authMiddleware;
  }

  getSessionOwnershipMiddleware(): RequestHandler {
    return this.sessionOwnershipMiddleware;
  }

  getPrisma(): PrismaClient {
    return this.prisma;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
