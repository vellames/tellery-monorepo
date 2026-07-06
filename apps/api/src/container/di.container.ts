import { PrismaClient } from '@prisma/client';
import { S3Client } from '@aws-sdk/client-s3';
import { t } from '@ai-history/i18n';
import { appConfig } from '../config/app.config';
import { HealthController } from '../controllers/health.controller';
import { StoryController } from '../controllers/story.controller';
import { SessionController } from '../controllers/session.controller';
import { SubscriptionController } from '../controllers/subscription/subscription.controller';
import { RevenueCatWebhookController } from '../controllers/subscription/revenuecat-webhook.controller';
import { LeadController } from '../controllers/lead/lead.controller';
import { UserController } from '../controllers/user/user.controller';
import { CharacterAgent } from '../engine/character/character-agent.service';
import { IntentDetectionService } from '../engine/intent/intent-detection.service';
import { ObjectAgent } from '../engine/object/object-agent.service';
import { OpenRouterStructuredChatModel } from '../engine/llm/openrouter-structured-chat-model';
import {
  IStoryDefinitionRepository,
  IImageUrlSigner,
  ILeadRepository,
  ISessionRepository,
  IPasswordHasher,
  ITokenService,
  IUserRepository,
  IAudioStorage,
  IAudioTranscriptionService,
  ISubscriptionRepository,
  IPlanRepository,
  IStripeService,
  IMailer,
  IEmailTokenService,
  IEmailVerificationService,
} from '../interfaces';
import {
  StoryDefinitionRepository,
  LeadRepository,
  LlmCallRecorder,
  PlanRepository,
  SessionRepository,
  SubscriptionRepository,
  UserRepository,
} from '../repositories';
import { StorySessionService } from '../services/session/story-session.service';
import { SessionInteractionService } from '../services/session/session-interaction.service';
import { SessionConclusionService } from '../services/session/session-conclusion.service';
import { StoryCatalogService } from '../services/story/story-catalog.service';
import { S3ImageUrlSigner } from '../services/image/s3-image-url-signer';
import { S3AudioStorage } from '../services/audio/s3-audio-storage';
import { OpenRouterAudioTranscriptionService } from '../services/audio/openrouter-audio-transcription.service';
import { BcryptPasswordHasher } from '../services/user/bcrypt-password-hasher';
import { JwtTokenService } from '../services/user/jwt-token.service';
import { UserService } from '../services/user/user.service';
import { ResendMailer } from '../services/email/resend-mailer';
import { EmailTokenService } from '../services/email/email-token.service';
import { EmailVerificationService } from '../services/email/email-verification.service';
import { StripeService } from '../services/subscription/stripe.service';
import { SubscriptionService } from '../services/subscription/subscription.service';
import { RevenueCatWebhookService } from '../services/subscription/revenuecat-webhook.service';
import { LeadService } from '../services/lead/lead.service';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { createSessionOwnershipMiddleware } from '../middleware/session-ownership.middleware';
import type { RequestHandler } from 'express';

export class DIContainer {
  private static instance: DIContainer;

  private readonly prisma = new PrismaClient();

  private readonly userRepository: IUserRepository = new UserRepository(
    this.prisma
  );
  private readonly planRepository: IPlanRepository = new PlanRepository(
    this.prisma
  );
  private readonly subscriptionRepository: ISubscriptionRepository =
    new SubscriptionRepository(this.prisma);
  private readonly storyDefinitionRepository: IStoryDefinitionRepository =
    new StoryDefinitionRepository(this.prisma);
  private readonly sessionRepository: ISessionRepository =
    new SessionRepository(this.prisma);
  private readonly leadRepository: ILeadRepository = new LeadRepository(
    this.prisma
  );
  private readonly llmCallRecorder = new LlmCallRecorder(
    this.sessionRepository
  );

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
  private readonly mailer: IMailer = new ResendMailer({
    token: appConfig.email.resend.apiKey,
    from: `"${appConfig.email.fromName}" <${appConfig.email.fromAddress}>`,
  });
  private readonly emailTokenService: IEmailTokenService =
    new EmailTokenService(
      appConfig.email.verificationJwtSecret,
      appConfig.email.verificationExpiresIn
    );
  private readonly emailVerificationService: IEmailVerificationService =
    new EmailVerificationService(this.mailer, this.emailTokenService, t, {
      webBaseUrl: appConfig.web.baseUrl,
      defaultLocale: appConfig.language.default,
    });
  private readonly userService = new UserService(
    this.userRepository,
    this.leadRepository,
    this.passwordHasher,
    this.tokenService,
    this.emailVerificationService
  );
  private readonly userController = new UserController(this.userService);
  private readonly leadService = new LeadService(this.leadRepository);
  private readonly leadController = new LeadController(this.leadService);
  private readonly stripeService: IStripeService = new StripeService({
    secretKey: appConfig.stripe.secretKey,
    webhookSecret: appConfig.stripe.webhookSecret,
    apiVersion: appConfig.stripe.apiVersion,
  });
  private readonly subscriptionService = new SubscriptionService(
    this.subscriptionRepository,
    this.planRepository,
    this.userRepository,
    this.stripeService,
    {
      monthlyPriceId: appConfig.stripe.monthlyPriceId,
      webBaseUrl: appConfig.web.baseUrl,
    }
  );
  private readonly subscriptionController = new SubscriptionController(
    this.subscriptionService
  );
  private readonly revenueCatWebhookService = new RevenueCatWebhookService(
    this.subscriptionRepository,
    this.planRepository,
    this.userRepository
  );
  private readonly revenueCatWebhookController =
    new RevenueCatWebhookController(this.revenueCatWebhookService, {
      webhookAuthorization: appConfig.revenueCat.webhookAuthorization,
    });
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
  private readonly storySessionService = new StorySessionService(
    this.userRepository,
    this.storyDefinitionRepository,
    this.sessionRepository,
    this.imageUrlSigner,
    this.subscriptionRepository
  );
  private readonly intentDetectionService = new IntentDetectionService(
    new OpenRouterStructuredChatModel(
      appConfig.openrouter.intentDetectorModel,
      'intent',
      this.llmCallRecorder
    ),
    appConfig.openrouter.intentDetectorThreshold,
    t
  );
  private readonly objectAgent = new ObjectAgent(
    new OpenRouterStructuredChatModel(
      appConfig.openrouter.objectAgentModel,
      'object',
      this.llmCallRecorder
    ),
    t
  );
  private readonly characterAgent = new CharacterAgent(
    new OpenRouterStructuredChatModel(
      appConfig.openrouter.characterAgentModel,
      'character',
      this.llmCallRecorder,
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
    new OpenRouterAudioTranscriptionService(this.llmCallRecorder);
  private readonly sessionController = new SessionController(
    this.storySessionService,
    this.sessionInteractionService,
    this.sessionConclusionService,
    this.audioStorage,
    this.audioTranscription
  );
  private readonly storyCatalogService = new StoryCatalogService(
    this.storyDefinitionRepository,
    this.imageUrlSigner
  );
  private readonly storyController = new StoryController(
    this.storyCatalogService
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

  getStoryController(): StoryController {
    return this.storyController;
  }

  getUserController(): UserController {
    return this.userController;
  }

  getLeadController(): LeadController {
    return this.leadController;
  }

  getSubscriptionController(): SubscriptionController {
    return this.subscriptionController;
  }

  getRevenueCatWebhookController(): RevenueCatWebhookController {
    return this.revenueCatWebhookController;
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
