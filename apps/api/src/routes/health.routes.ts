import { Router } from "express";
import { DIContainer } from "../container/di.container";

const router = Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: API root
 *     description: Returns available endpoints.
 *     responses:
 *       200:
 *         description: API info and endpoint list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: AI History API
 *                 endpoints:
 *                   type: object
 */
router.get("/", (req, res) => {
  DIContainer.getInstance().getHealthController().index(req, res);
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns server health status.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get("/health", (req, res) => {
  DIContainer.getInstance().getHealthController().health(req, res);
});

export default router;
