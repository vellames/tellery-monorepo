import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { ITokenService } from '../../interfaces';
import { TokenPayload } from '../../interfaces/services/token-service.interface';
import { createAuthMiddleware } from '../auth.middleware';
import { TranslationFunction } from '../../types/i18n.types';

describe('authMiddleware', () => {
  let tokenService: DeepMockProxy<ITokenService>;
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
    middleware = createAuthMiddleware(tokenService);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    next = jest.fn() as NextFunction;
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
    req = { t };
  });

  afterEach(() => {
    mockReset(tokenService);
  });

  it('populates req.user and calls next when token is valid', () => {
    req.headers = { authorization: 'Bearer valid-token' };
    tokenService.verify.mockReturnValue(validPayload);

    middleware(req as Request, res as Response, next);

    expect(tokenService.verify).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual({ id: 'user-1', email: 'ana@teste.local' });
    expect(next).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is missing', () => {
    req.headers = {};

    middleware(req as Request, res as Response, next);

    expect(tokenService.verify).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is not a Bearer token', () => {
    req.headers = { authorization: 'Basic abc123' };

    middleware(req as Request, res as Response, next);

    expect(tokenService.verify).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification throws', () => {
    req.headers = { authorization: 'Bearer expired-token' };
    tokenService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    middleware(req as Request, res as Response, next);

    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('trims whitespace around the token value', () => {
    req.headers = { authorization: 'Bearer   spaced-token   ' };
    tokenService.verify.mockReturnValue(validPayload);

    middleware(req as Request, res as Response, next);

    expect(tokenService.verify).toHaveBeenCalledWith('spaced-token');
    expect(next).toHaveBeenCalled();
  });
});
