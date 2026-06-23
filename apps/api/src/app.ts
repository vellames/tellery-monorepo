import cors from "cors";
import express from "express";
import { i18nMiddleware } from "@ai-history/i18n";
import routes from "./routes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(i18nMiddleware);
  app.use(express.json());
  app.use(routes);

  return app;
}
