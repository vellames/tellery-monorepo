import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;

    if (logLevel === 'error') {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  });

  next();
};
