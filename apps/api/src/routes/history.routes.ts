import { Router, RequestHandler } from 'express';
import { DIContainer } from '../container/di.container';

const router = Router();

const authenticate: RequestHandler = (req, res, next) => {
  DIContainer.getInstance().getAuthMiddleware()(req, res, next);
};

/**
 * @openapi
 * /histories:
 *   get:
 *     tags: [History]
 *     summary: List available histories
 *     description: Returns the catalog of published histories available to start.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Available histories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       title:
 *                         type: string
 *                       subtitle:
 *                         type: string
 *                         nullable: true
 *                       teaser:
 *                         type: string
 *                       genre:
 *                         type: string
 *                       estimatedDurationMinutes:
 *                         type: integer
 *                       coverImageUrl:
 *                         type: string
 *                         nullable: true
 *                       thumbnailUrl:
 *                         type: string
 *                         nullable: true
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get('/', authenticate, async (req, res) => {
  await DIContainer.getInstance().getHistoryController().list(req, res);
});

export default router;
