import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { IUserRepository } from '../../interfaces';
import { User } from '@prisma/client';
import { UserController } from '../../controllers/user/user.controller';
import { UserService } from '../../services/user/user.service';

// Mock i18n middleware so we don't need to initialize i18next
jest.mock('@ai-history/i18n', () => ({
  initI18n: jest.fn().mockResolvedValue(undefined),
  i18nMiddleware: (_req: any, _res: any, next: any) => next(),
  i18next: { changeLanguage: jest.fn(), t: (k: string) => k },
  t: (lang: string, key: string) => key,
}));

// Build mock-backed controller instances before mocking the container
const mockRepo: DeepMockProxy<IUserRepository> = mockDeep<IUserRepository>();
const userService = new UserService(mockRepo);
const userController = new UserController(userService);

// Mock DIContainer so routes use our mock-backed controllers
jest.mock('../../container/di.container', () => ({
  DIContainer: {
    getInstance: () => ({
      getUserController: () => userController,
      getHealthController: () => ({
        index: (_req: any, res: any) =>
          res.json({ message: 'AI History API', endpoints: {} }),
        health: (_req: any, res: any) => res.json({ status: 'ok' }),
      }),
      getSessionController: () => ({
        start: async (_req: any, res: any) => res.status(201).json({}),
        interact: async (_req: any, res: any) => res.json({}),
      }),
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
  ...overrides,
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
      id: 'user-1',
      name: 'Ana Teste',
      email: 'ana@teste.local',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(response.body.data).not.toHaveProperty('password');
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

  it('should return 409 when email is already in use', async () => {
    mockRepo.findByEmail.mockResolvedValue(mockUser());

    const response = await request(app).post('/users/register').send({
      name: 'Ana Teste',
      email: 'ana@teste.local',
      password: 'password123',
    });

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Email already in use');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get(
      '/users/nonexistent-endpoint'
    );

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body.success).toBe(false);
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
