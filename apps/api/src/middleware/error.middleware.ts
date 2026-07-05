import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TranslationFunction } from '../types/i18n.types';

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const t = req.t as TranslationFunction;
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: t('common:errors.routeNotFound', {
      method: req.method,
      path: req.path,
    }),
  });
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const t = req.t as TranslationFunction;
  console.error('Error:', error);

  if ('statusCode' in error && typeof error.statusCode === 'number') {
    const messageKey = (error as { messageKey?: string }).messageKey;
    const message = messageKey ? t(messageKey) : error.message;
    res.status(error.statusCode).json({
      success: false,
      error: message,
    });
    return;
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: t('common:errors.databaseError'),
    });
    return;
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? t('common:errors.internalServerError')
        : error.message,
  });
};

/**
 * Catch-all for async errors thrown inside route handlers that weren't caught
 * by a try/catch and therefore never reached `errorHandler`. Express 4 does not
 * forward rejected async handlers to the error middleware automatically — this
 * listener (attached via `process.on('unhandledRejection')` in index.ts) is the
 * safety net that surfaces them. Without it, the request just hangs or the
 * server logs a bare 500 with no context.
 */
export const logUnhandledError = (where: string, error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[unhandled:${where}]`, {
    message: err.message,
    name: err.name,
    stack: err.stack,
  });
};
