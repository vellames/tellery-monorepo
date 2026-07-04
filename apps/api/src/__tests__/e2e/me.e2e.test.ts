import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { Request, Response } from 'express';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  IEmailVerificationService,
  ILeadRepository,
} from '../../interfaces';
import { User } from '@prisma/client';
import { UserController } from '../../controllers/user/user.controller';
import { UserService } from '../../services/user/user.service';
import { JwtTokenService } from '../../services/user/jwt-token.service';
import { createAuthMiddleware } from '../../middleware/auth.middleware';
import { initI18n } from '@ai-history/i18n';

const TEST_JWT_SECRET = 'test-secret';
const TEST_JWT_EXPIRES_IN = '1h';
const AUTHENTICATED_USER_ID = 'user-1';
const AUTHENTICATED_USER_EMAIL = 'ana@teste.local';

const mockRepo: DeepMockProxy<IUserRepository> = mockDeep<IUserRepository>();
const mockPasswordHasher: DeepMockProxy<IPasswordHasher> =
  mockDeep<IPasswordHasher>();
mockPasswordHasher.hash.mockResolvedValue('hashed-password');
const realTokenService: ITokenService = new JwtTokenService(
  TEST_JWT_SECRET,
  TEST_JWT_EXPIRES_IN
);
const mockEmailVerification: DeepMockProxy<IEmailVerificationService> =
  mockDeep<IEmailVerificationService>();
const mockLeadRepo: DeepMockProxy<ILeadRepository> =
  mockDeep<ILeadRepository>();
const userService = new UserService(
  mockRepo,
  mockLeadRepo,
  mockPasswordHasher,
  realTokenService,
  mockEmailVerification
);
const userController = new UserController(userService);

const validToken = realTokenService.sign({
  sub: AUTHENTICATED_USER_ID,
  email: AUTHENTICATED_USER_EMAIL,
});

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
      getAuthMiddleware: () => createAuthMiddleware(realTokenService),
    }),
  },
}));

import { createApp } from '../../app';

const app = createApp();

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: AUTHENTICATED_USER_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  name: 'Ana Teste',
  email: AUTHENTICATED_USER_EMAIL,
  password: 'hashed-password',
  ssn: null,
  emailVerifiedAt: null,
  availableCredits: 3,
  ...overrides,
});

const authHeader = { Authorization: `Bearer ${validToken}` };

beforeAll(async () => {
  await initI18n();
});

describe('E2E: GET /me', () => {
  afterEach(() => {
    mockReset(mockRepo);
  });

  it('should return 200 with the logged-in user profile when authenticated', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());

    const response = await request(app).get('/me').set(authHeader);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      id: AUTHENTICATED_USER_ID,
      name: 'Ana Teste',
      email: AUTHENTICATED_USER_EMAIL,
      ssn: null,
      emailVerifiedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(response.body.data).not.toHaveProperty('password');
    expect(mockRepo.findById).toHaveBeenCalledWith(AUTHENTICATED_USER_ID);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get('/me');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body.success).toBe(false);
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it('should return 404 when the authenticated user no longer exists', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const response = await request(app).get('/me').set(authHeader);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body.success).toBe(false);
  });
});

describe('E2E: PATCH /me', () => {
  afterEach(() => {
    mockReset(mockRepo);
  });

  it('should return 200 with the updated user when updating name and email', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());
    mockRepo.update.mockResolvedValue(
      mockUser({ name: 'Ana Updated', email: 'ana.updated@teste.local' })
    );

    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .send({ name: 'Ana Updated', email: 'ana.updated@teste.local' });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      id: AUTHENTICATED_USER_ID,
      name: 'Ana Updated',
      email: 'ana.updated@teste.local',
      ssn: null,
      emailVerifiedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(mockRepo.update).toHaveBeenCalledWith(
      AUTHENTICATED_USER_ID,
      expect.objectContaining({
        name: 'Ana Updated',
        email: 'ana.updated@teste.local',
      })
    );
  });

  it('should return 200 when updating only the name', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());
    mockRepo.update.mockResolvedValue(mockUser({ name: 'Only Name' }));

    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .send({ name: 'Only Name' });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.data.name).toBe('Only Name');
    expect(mockRepo.update).toHaveBeenCalledWith(AUTHENTICATED_USER_ID, {
      name: 'Only Name',
    });
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).patch('/me').send({ name: 'Ana' });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('should return 422 when email is invalid', async () => {
    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('should return 422 when a password field is sent', async () => {
    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .send({ name: 'Ana', password: 'secret' });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
  });

  it('should normalize a valid CPF when updating ssn', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());
    mockRepo.update.mockResolvedValue(mockUser({ ssn: '29537995593' }));

    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .send({ ssn: '295.379.955-93' });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.data.ssn).toBe('29537995593');
    expect(mockRepo.update).toHaveBeenCalledWith(AUTHENTICATED_USER_ID, {
      ssn: '29537995593',
    });
  });

  it('should return 422 when ssn is not a valid CPF', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());

    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .send({ ssn: '111.111.111-11' });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('should return 409 when email is already in use', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());
    mockRepo.findByEmail.mockResolvedValue(
      mockUser({ id: 'user-2', email: 'taken@teste.local' })
    );

    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .set('Accept-Language', 'en')
      .send({ email: 'taken@teste.local' });

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Email already in use');
  });

  it('should return 404 when the authenticated user no longer exists', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .send({ name: 'Ana' });

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body.success).toBe(false);
  });

  it('should return 422 with Portuguese message when email is invalid', async () => {
    const response = await request(app)
      .patch('/me')
      .set(authHeader)
      .set('Accept-Language', 'pt-BR')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Corpo da requisição inválido');
  });
});

describe('E2E: PATCH /me/password', () => {
  afterEach(() => {
    mockReset(mockRepo);
    mockReset(mockPasswordHasher);
    mockPasswordHasher.hash.mockResolvedValue('hashed-password');
  });

  it('should return 200 and rotate the password when the current password is valid', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockRepo.update.mockResolvedValue(mockUser());

    const response = await request(app)
      .patch('/me/password')
      .set(authHeader)
      .send({ currentPassword: 'password123', newPassword: 'new-password' });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(mockPasswordHasher.compare).toHaveBeenCalledWith(
      'password123',
      'hashed-password'
    );
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('new-password');
    expect(mockRepo.update).toHaveBeenCalledWith(AUTHENTICATED_USER_ID, {
      password: 'hashed-password',
    });
  });

  it('should return 401 when the current password is wrong', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());
    mockPasswordHasher.compare.mockResolvedValue(false);

    const response = await request(app)
      .patch('/me/password')
      .set(authHeader)
      .send({ currentPassword: 'wrong-password', newPassword: 'new-password' });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body.success).toBe(false);
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('should return 401 with Portuguese message when the current password is wrong', async () => {
    mockRepo.findById.mockResolvedValue(mockUser());
    mockPasswordHasher.compare.mockResolvedValue(false);

    const response = await request(app)
      .patch('/me/password')
      .set(authHeader)
      .set('Accept-Language', 'pt-BR')
      .send({ currentPassword: 'wrong-password', newPassword: 'new-password' });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body.error).toBe('Senha atual incorreta');
  });

  it('should return 422 when required fields are missing', async () => {
    const response = await request(app)
      .patch('/me/password')
      .set(authHeader)
      .send({ currentPassword: 'password123' });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
    expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
  });

  it('should return 422 when newPassword is shorter than 6 chars', async () => {
    const response = await request(app)
      .patch('/me/password')
      .set(authHeader)
      .send({ currentPassword: 'password123', newPassword: '12345' });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('should return 422 when newPassword equals currentPassword', async () => {
    const response = await request(app)
      .patch('/me/password')
      .set(authHeader)
      .send({ currentPassword: 'same-password', newPassword: 'same-password' });

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.success).toBe(false);
    expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app)
      .patch('/me/password')
      .send({ currentPassword: 'password123', newPassword: 'new-password' });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
  });

  it('should return 404 when the authenticated user no longer exists', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const response = await request(app)
      .patch('/me/password')
      .set(authHeader)
      .send({ currentPassword: 'password123', newPassword: 'new-password' });

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body.success).toBe(false);
  });
});
