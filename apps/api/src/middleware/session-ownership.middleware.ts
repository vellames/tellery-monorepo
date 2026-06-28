import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '../interfaces';
import { TranslationFunction } from '../types/i18n.types';

export const createSessionOwnershipMiddleware = (
  sessions: ISessionRepository
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const t = req.t as TranslationFunction;
    const sessionId = String(req.params.sessionId);

    if (!sessionId) {
      next();
      return;
    }

    const session = await sessions.findById(sessionId);
    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: t('session:errors.unknownSession', { id: sessionId }),
      });
      return;
    }

    if (session.userId !== req.user?.id) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: t('session:errors.sessionNotOwned'),
      });
      return;
    }

    req.sessionOwnership = {
      session,
    };

    next();
  };
};

declare module 'express-serve-static-core' {
  interface Request {
    sessionOwnership?: {
      session: unknown;
    };
  }
}
