import { createApp } from "./app";
import { appConfig } from "./config/app.config";

const app = createApp();

app.listen(appConfig.port, () => {
  console.log(`Server running at http://localhost:${appConfig.port}`);
});
