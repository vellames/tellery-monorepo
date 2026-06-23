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

void startServer();
