import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: StatusCodes = StatusCodes.OK
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: StatusCodes = StatusCodes.UNPROCESSABLE_ENTITY
): void => {
  res.status(statusCode).json({
    success: false,
    error,
  });
};

export const sendValidationError = (
  res: Response,
  error: string,
  issues: unknown[]
): void => {
  res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
    success: false,
    error,
    issues,
  });
};

export const handleError = (
  res: Response,
  error: unknown,
  statusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR,
  /**
   * Optional message shown to the client. Defaults to the error's own message.
   * Use this to avoid leaking internal error details on 5xx (pass a generic
   * message) while still logging the real cause below.
   */
  clientMessage?: string
): void => {
  // Always log the underlying error so a 500 never happens silently. The
  // controllers catch the original error and pass it here; before, it was
  // discarded in favor of a generic message and the cause was lost.
  if (statusCode >= 500) {
    console.error('[handleError] internal error', {
      statusCode,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  const responseMessage =
    clientMessage ??
    (error instanceof Error ? error.message : 'Internal server error');

  res.status(statusCode).json({
    success: false,
    error: responseMessage,
  });
};
