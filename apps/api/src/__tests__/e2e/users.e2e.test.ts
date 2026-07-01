import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { Request, Response, NextFunction } from 'express';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  IEmailVerificationService,
} from '../../interfaces';
import { User } from '@prisma/client';
import { UserController } from '../../controllers/user/user.controller';
import { UserService } from '../../services/user/user.service';
import { HttpError } from '../../utils/http-error';
import { initI18n } from '@ai-history/i18n';

// Build mock-backed controller instances before mocking the container
const mockRepo: DeepMockProxy<IUserRepository> = mockDeep<IUserRepository>();
const mockPasswordHasher: DeepMockProxy<IPasswordHasher> =
  mockDeep<IPasswordHasher>();
mockPasswordHasher.hash.mockResolvedValue('hashed-password');
const mockTokenService: DeepMockProxy<ITokenService> =
  mockDeep<ITokenService>();
mockTokenService.sign.mockReturnValue('signed-token');
const mockEmailVerification: DeepMockProxy<IEmailVerificationService> =
  mockDeep<IEmailVerificationService>();
const userService = new UserService(
  mockRepo,
  mockPasswordHasher,
  mockTokenService,
  mockEmailVerification
);
const userController = new UserController(userService);

// Mock DIContainer so routes use our mock-backed controllers
jest.mock('../../container/di.container', () => ({
  DIContainer: {
    getInstance: () => ({
      getUserController: () => userController,
      getHealthController: () => ({
        index: (_req: Request, res: Response) =>
          res.json({ message: 'AI History API', endpoints: {} }),
        health: (_req: Request, res: Response) => res.json({ status: 'ok' }),
        readiness: async (_req: Request, res: Response) =>
          res.json({ status: 'ok', database: 'connected' }),
      }),
      getSessionController: () => ({
        start: async (_req: Request, res: Response) =>
          res.status(StatusCodes.CREATED).json({}),
        interact: async (_req: Request, res: Response) => res.json({}),
      }),
      getAuthMiddleware:
        () =>
        (req: Request, _res: Response, next: NextFunction): void => {
          (req as { user?: { id: string; email: string } }).user = {
            id: 'user-1',
            email: 'ana@teste.local',
          };
          next();
        },
    }),
  },
}));

import { createApp } from '../../app';

const app = createApp();

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  name: 'Ana Teste',
  email: 'ana@teste.local',
  password: 'password123',
  ssn: null,
  emailVerifiedAt: null,
  availableCredits: 3,
  ...overrides,
});

beforeAll(async () => {
  await initI18n();
});

beforeEach(() => {
  mockReset(mockEmailVerification);
  mockEmailVerification.verifyToken.mockReturnValue({
    sub: 'user-1',
    email: 'ana@teste.local',
  });
  mockEmailVerification.sendVerification.mockResolvedValue(undefined);
});

describe('E2E: /users/register', () => {
  afterEach(() => {
    mockReset(mockRepo);
  });

  it('should return 201 and create a user with valid data', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(mockUser());

    const response = await request(app).post('/users/register').send({
      name: 'Ana Teste',
      email: 'ana@teste.local',
      password: 'password123',
    });

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      user: {
        id: 'user-1',
        name: 'Ana Teste',
        email: 'ana@teste.local',
        ssn: null,
        emailVerifiedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      token: 'signed-token',
    });
    expect(response.body.data).not.toHaveProperty('password');
    expect(response.body.data.user).not.toHaveProperty('password');
    expect(mockEmailVerification.sendVerification).toHaveBeenCalled();
  });

  it('should return 422 when name is missing', async () => {
    const response = await request(app).post('/users/register').send({
      email: 'ana@teste.local',
      password: 'password123',
    });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
  });

  it('should return 422 when email is invalid', async () => {
    const response = await request(app).post('/users/register').send({
      name: 'Ana Teste',
      email: 'not-an-email',
      password: 'password123',
    });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
  });

  it('should return 422 when password is missing', async () => {
    const response = await request(app).post('/users/register').send({
      name: 'Ana Teste',
      email: 'ana@teste.local',
    });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
  });

  it('should return 409 with Portuguese message by default', async () => {
    mockRepo.findByEmail.mockResolvedValue(mockUser());

    const response = await request(app).post('/users/register').send({
      name: 'Ana Teste',
      email: 'ana@teste.local',
      password: 'password123',
    });

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('E-mail já está em uso');
  });

  it('should return 409 with Portuguese message when Accept-Language is pt-BR', async () => {
    mockRepo.findByEmail.mockResolvedValue(mockUser());

    const response = await request(app)
      .post('/users/register')
      .set('Accept-Language', 'pt-BR')
      .send({
        name: 'Ana Teste',
        email: 'ana@teste.local',
        password: 'password123',
      });

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('E-mail já está em uso');
  });

  it('should return 422 with Portuguese message when Accept-Language is pt-BR', async () => {
    const response = await request(app)
      .post('/users/register')
      .set('Accept-Language', 'pt-BR')
      .send({
        email: 'ana@teste.local',
        password: 'password123',
      });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Corpo da requisição inválido');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/users/nonexistent-endpoint');

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body.success).toBe(false);
  });
});

describe('E2E: /users/login', () => {
  afterEach(() => {
    mockReset(mockRepo);
    mockReset(mockPasswordHasher);
    mockPasswordHasher.hash.mockResolvedValue('hashed-password');
    mockTokenService.sign.mockReturnValue('signed-token');
  });

  it('should return 200 with user and token when credentials are valid', async () => {
    mockRepo.findByEmail.mockResolvedValue(mockUser());
    mockPasswordHasher.compare.mockResolvedValue(true);

    const response = await request(app).post('/users/login').send({
      email: 'ana@teste.local',
      password: 'password123',
    });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      user: {
        id: 'user-1',
        name: 'Ana Teste',
        email: 'ana@teste.local',
        ssn: null,
        emailVerifiedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      token: 'signed-token',
    });
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  it('should return 401 when user is not found', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    const response = await request(app)
      .post('/users/login')
      .set('Accept-Language', 'en')
      .send({
        email: 'unknown@teste.local',
        password: 'password123',
      });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid email or password');
  });

  it('should return 401 when password does not match', async () => {
    mockRepo.findByEmail.mockResolvedValue(mockUser());
    mockPasswordHasher.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/users/login')
      .set('Accept-Language', 'en')
      .send({
        email: 'ana@teste.local',
        password: 'wrong-password',
      });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid email or password');
  });

  it('should return 422 when email is invalid', async () => {
    const response = await request(app).post('/users/login').send({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
  });

  it('should return 422 when password is missing', async () => {
    const response = await request(app).post('/users/login').send({
      email: 'ana@teste.local',
    });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
  });

  it('should return 401 with Portuguese message when Accept-Language is pt-BR', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    const response = await request(app)
      .post('/users/login')
      .set('Accept-Language', 'pt-BR')
      .send({
        email: 'unknown@teste.local',
        password: 'password123',
      });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('E-mail ou senha inválidos');
  });
});

describe('E2E: /users/verify-email', () => {
  afterEach(() => mockReset(mockRepo));

  it('should return 200 and verify the user when the token is valid', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());
    mockRepo.markEmailVerified.mockResolvedValue(
      mockUser({ emailVerifiedAt: new Date('2026-07-01T00:00:00.000Z') })
    );

    const response = await request(app)
      .post('/users/verify-email')
      .send({ token: 'valid-token' });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data.emailVerifiedAt).toBe('2026-07-01T00:00:00.000Z');
    expect(mockEmailVerification.verifyToken).toHaveBeenCalledWith(
      'valid-token'
    );
    expect(mockRepo.markEmailVerified).toHaveBeenCalledWith('user-1');
  });

  it('should return 422 when the token is invalid', async () => {
    mockEmailVerification.verifyToken.mockImplementationOnce(() => {
      throw new HttpError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'Invalid or expired verification token',
        'user:errors.invalidVerificationToken'
      );
    });

    const response = await request(app)
      .post('/users/verify-email')
      .send({ token: 'bad-token' });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
  });

  it('should return 422 when the token is missing', async () => {
    const response = await request(app).post('/users/verify-email').send({});

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
  });

  it('should return 409 when the email is already verified', async () => {
    mockRepo.findById.mockResolvedValue(
      mockUser({ emailVerifiedAt: new Date('2026-07-01') })
    );

    const response = await request(app)
      .post('/users/verify-email')
      .send({ token: 'valid-token' });

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(mockRepo.markEmailVerified).not.toHaveBeenCalled();
  });
});

describe('E2E: /users/resend-verification', () => {
  afterEach(() => mockReset(mockRepo));

  it('should resend the verification email to an unverified user', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());

    const response = await request(app).post('/users/resend-verification');

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(mockEmailVerification.sendVerification).toHaveBeenCalled();
  });

  it('should return 409 when the email is already verified', async () => {
    mockRepo.findById.mockResolvedValue(
      mockUser({ emailVerifiedAt: new Date('2026-07-01') })
    );

    const response = await request(app).post('/users/resend-verification');

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(mockEmailVerification.sendVerification).not.toHaveBeenCalled();
  });
});

describe('E2E: /health', () => {
  it('should return 200 with status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.status).toBe('ok');
  });
});

describe('E2E: /', () => {
  it('should return 200 with API info', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.message).toBe('AI History API');
  });
});
