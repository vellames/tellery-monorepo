import { Router } from 'express';
import { DIContainer } from '../container/di.container';

const router = Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: API root
 *     description: Returns available endpoints.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
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
router.get('/', (req, res) => {
  DIContainer.getInstance().getHealthController().index(req, res);
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns server health status.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
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
router.get('/health', (req, res) => {
  DIContainer.getInstance().getHealthController().health(req, res);
});

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness check
 *     description: Checks if the server and database are ready to accept traffic.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Server is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Server is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 database:
 *                   type: string
 *                   example: disconnected
 */
router.get('/health/ready', async (req, res) => {
  await DIContainer.getInstance().getHealthController().readiness(req, res);
});

export default router;
