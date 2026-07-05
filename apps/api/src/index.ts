import { Server } from 'http';
import { initI18n } from '@ai-history/i18n';
import { createApp } from './app';
import { appConfig } from './config/app.config';
import { DIContainer } from './container/di.container';

async function startServer() {
  await initI18n();

  const app = createApp();
  const container = DIContainer.getInstance();

  const server: Server = app.listen(appConfig.port, () => {
    console.log(`Server running at http://localhost:${appConfig.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);

    server.close(() => {
      console.log('HTTP server closed.');
    });

    try {
      await container.disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

// Catch-all loggers — surface anything that escapes the request cycle so a bare
// 500 (or worse, a silent hang) never happens without a stack trace.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

void startServer();
