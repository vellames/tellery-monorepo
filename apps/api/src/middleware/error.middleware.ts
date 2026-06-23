import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Error:", error);

  if ("statusCode" in error && typeof error.statusCode === "number") {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.name === "PrismaClientKnownRequestError") {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Database operation failed",
    });
    return;
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
};
