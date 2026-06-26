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
 *       - name: isFeatured
 *         in: query
 *         required: true
 *         schema:
 *           type: boolean
 *         description: Filter histories by featured flag. Must be `true` or `false`.
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-based).
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page.
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
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           title:
 *                             type: string
 *                           subtitle:
 *                             type: string
 *                             nullable: true
 *                           teaser:
 *                             type: string
 *                           genre:
 *                             type: string
 *                           estimatedDurationMinutes:
 *                             type: integer
 *                           isFree:
 *                             type: boolean
 *                           coverImageUrl:
 *                             type: string
 *                             nullable: true
 *                           thumbnailUrl:
 *                             type: string
 *                             nullable: true
 *                     total:
 *                       type: integer
 *                       description: Total number of matching histories.
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       422:
 *         description: Invalid or missing query parameter (isFeatured, page or limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ValidationError"
 */
router.get('/', authenticate, async (req, res) => {
  await DIContainer.getInstance().getHistoryController().list(req, res);
});

export default router;
