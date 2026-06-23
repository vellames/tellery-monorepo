import { Response } from "express";
import { StatusCodes } from "http-status-codes";

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
  statusCode: StatusCodes = StatusCodes.BAD_REQUEST
): void => {
  res.status(statusCode).json({
    success: false,
    error,
  });
};

export const handleError = (
  res: Response,
  error: unknown,
  statusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR
): void => {
  res.status(statusCode).json({
    success: false,
    error: error instanceof Error ? error.message : "Internal server error",
  });
};
