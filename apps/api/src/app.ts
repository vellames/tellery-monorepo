import cors from "cors";
import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { i18nMiddleware } from "@ai-history/i18n";
import routes from "./routes";
import { swaggerSpec } from "./config/swagger.config";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(i18nMiddleware);
  app.use(express.json());

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "AI History API Documentation",
      customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #3b82f6; }
    `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
      },
    })
  );

  app.get("/api/swagger.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.use(routes);

  return app;
}
