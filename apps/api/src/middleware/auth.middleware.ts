import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ITokenService, IUserRepository } from '../interfaces';
import { TranslationFunction } from '../types/i18n.types';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

const BEARER_PREFIX = 'Bearer ';

export const createAuthMiddleware = (
  tokenService: ITokenService,
  users: IUserRepository
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const t = req.t as TranslationFunction;
    const header = req.headers.authorization;

    const unauthorized = (): void => {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: t('common:errors.authenticationRequired'),
      });
    };

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      unauthorized();
      return;
    }

    const token = header.slice(BEARER_PREFIX.length).trim();

    let payload;
    try {
      payload = tokenService.verify(token);
    } catch {
      unauthorized();
      return;
    }

    // Reject tokens issued for accounts that have since been soft-deleted
    // (deleted users cannot perform any authenticated action).
    const user = await users.findById(payload.sub);
    if (!user) {
      unauthorized();
      return;
    }

    req.user = { id: payload.sub, email: payload.email };
    next();
  };
};
