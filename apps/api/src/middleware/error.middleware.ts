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
