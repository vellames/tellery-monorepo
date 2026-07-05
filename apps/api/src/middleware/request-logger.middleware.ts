import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // On response finish, log the request line. For error responses (>= 400)
  // also include the body, res.locals, and any error attached to res.locals
  // so the cause isn't lost — Express only sends the status code to the logger
  // by default.
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;

    if (isError) {
      console.error(logMessage, {
        statusCode: res.statusCode,
        body: req.body,
        locals: res.locals,
      });
    } else {
      console.log(logMessage);
    }
  });

  next();
};
