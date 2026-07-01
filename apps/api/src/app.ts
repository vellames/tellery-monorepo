import cors from 'cors';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { i18nMiddleware } from '@ai-history/i18n';
import routes from './routes';
import { swaggerSpec } from './config/swagger.config';
import { appConfig } from './config/app.config';
import { requestLogger } from './middleware/request-logger.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: appConfig.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    })
  );
  app.use(i18nMiddleware);
  app.use(requestLogger);
  app.use('/subscriptions/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'AI History API Documentation',
      customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #3b82f6; }
    `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      },
    })
  );

  app.get('/api/swagger.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
