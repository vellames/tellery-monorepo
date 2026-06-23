import { initI18n } from "@ai-history/i18n";
import { createApp } from "./app";
import { appConfig } from "./config/app.config";

async function startServer() {
  await initI18n();

  const app = createApp();

  app.listen(appConfig.port, () => {
    console.log(`Server running at http://localhost:${appConfig.port}`);
  });
}

void startServer();
