import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { ITokenService, IUserRepository } from '../../interfaces';
import { TokenPayload } from '../../interfaces/services/token-service.interface';
import { createAuthMiddleware } from '../auth.middleware';
import { TranslationFunction } from '../../types/i18n.types';

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  name: 'Ana Teste',
  email: 'ana@teste.local',
  password: 'hashed-password',
  accountType: 'permanent',
  ssn: null,
  emailVerifiedAt: null,
  availableCredits: 3,
  ...overrides,
});

describe('authMiddleware', () => {
  let tokenService: DeepMockProxy<ITokenService>;
  let userRepository: DeepMockProxy<IUserRepository>;
  let middleware: ReturnType<typeof createAuthMiddleware>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let next: NextFunction;
  let t: TranslationFunction;

  const validPayload: TokenPayload = {
    sub: 'user-1',
    email: 'ana@teste.local',
  };

  beforeEach(() => {
    tokenService = mockDeep<ITokenService>();
    userRepository = mockDeep<IUserRepository>();
    middleware = createAuthMiddleware(tokenService, userRepository);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    next = jest.fn() as NextFunction;
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
    req = { t };
  });

  afterEach(() => {
    mockReset(tokenService);
    mockReset(userRepository);
  });

  it('populates req.user and calls next when token is valid and the user exists', async () => {
    req.headers = { authorization: 'Bearer valid-token' };
    tokenService.verify.mockReturnValue(validPayload);
    userRepository.findById.mockResolvedValue(mockUser());

    await middleware(req as Request, res as Response, next);

    expect(tokenService.verify).toHaveBeenCalledWith('valid-token');
    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    expect(req.user).toEqual({ id: 'user-1', email: 'ana@teste.local' });
    expect(next).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is missing', async () => {
    req.headers = {};

    await middleware(req as Request, res as Response, next);

    expect(tokenService.verify).not.toHaveBeenCalled();
    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is not a Bearer token', async () => {
    req.headers = { authorization: 'Basic abc123' };

    await middleware(req as Request, res as Response, next);

    expect(tokenService.verify).not.toHaveBeenCalled();
    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification throws', async () => {
    req.headers = { authorization: 'Bearer expired-token' };
    tokenService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await middleware(req as Request, res as Response, next);

    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('trims whitespace around the token value', async () => {
    req.headers = { authorization: 'Bearer   spaced-token   ' };
    tokenService.verify.mockReturnValue(validPayload);
    userRepository.findById.mockResolvedValue(mockUser());

    await middleware(req as Request, res as Response, next);

    expect(tokenService.verify).toHaveBeenCalledWith('spaced-token');
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when the user associated with the token no longer exists (e.g. deleted)', async () => {
    req.headers = { authorization: 'Bearer valid-token' };
    tokenService.verify.mockReturnValue(validPayload);
    userRepository.findById.mockResolvedValue(null);

    await middleware(req as Request, res as Response, next);

    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
