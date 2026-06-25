import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ITokenService } from '../interfaces';
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

export const createAuthMiddleware = (tokenService: ITokenService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const t = req.t as TranslationFunction;
    const header = req.headers.authorization;

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: t('common:errors.authenticationRequired'),
      });
      return;
    }

    const token = header.slice(BEARER_PREFIX.length).trim();

    try {
      const payload = tokenService.verify(token);
      req.user = { id: payload.sub, email: payload.email };
      next();
    } catch {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: t('common:errors.authenticationRequired'),
      });
    }
  };
};
