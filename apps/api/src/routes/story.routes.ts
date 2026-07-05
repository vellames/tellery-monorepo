import { Router, RequestHandler } from 'express';
import { DIContainer } from '../container/di.container';

const router = Router();

const authenticate: RequestHandler = (req, res, next) => {
  DIContainer.getInstance().getAuthMiddleware()(req, res, next);
};

/**
 * @openapi
 * /stories:
 *   get:
 *     tags: [Story]
 *     summary: List available stories
 *     description: Returns the catalog of published stories available to start.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: isFeatured
 *         in: query
 *         required: true
 *         schema:
 *           type: boolean
 *         description: Filter stories by featured flag. Must be `true` or `false`.
 *       - name: isFree
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter stories by access tier. `true` returns only free stories, `false` returns only premium stories. When omitted, all stories are returned regardless of access tier.
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
 *         description: Available stories
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
 *                       description: Total number of matching stories.
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
 *         description: Invalid or missing query parameter (isFeatured, isFree, page or limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ValidationError"
 */
router.get('/', authenticate, async (req, res) => {
  await DIContainer.getInstance().getStoryController().list(req, res);
});

/**
 * @openapi
 * /stories/slug/{slug}:
 *   get:
 *     tags: [Story]
 *     summary: Get a single story by slug
 *     description: Returns the catalog data of a single published story by its slug.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The story slug.
 *     responses:
 *       200:
 *         description: The requested story
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
 *                     id:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     title:
 *                       type: string
 *                     subtitle:
 *                       type: string
 *                       nullable: true
 *                     teaser:
 *                       type: string
 *                     genre:
 *                       type: string
 *                     estimatedDurationMinutes:
 *                       type: integer
 *                     isFree:
 *                       type: boolean
 *                     coverImageUrl:
 *                       type: string
 *                       nullable: true
 *                     thumbnailUrl:
 *                       type: string
 *                       nullable: true
 *                     opening:
 *                       type: string
 *                       description: The opening narration shown on the story start screen.
 *                     objective:
 *                       type: string
 *                       description: The goal the player must resolve.
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get('/slug/:slug', authenticate, async (req, res) => {
  await DIContainer.getInstance().getStoryController().getBySlug(req, res);
});

/**
 * @openapi
 * /stories/{storyId}:
 *   get:
 *     tags: [Story]
 *     summary: Get a single story
 *     description: Returns the catalog data of a single published story by id.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: storyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The story id.
 *     responses:
 *       200:
 *         description: The requested story
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
 *                     id:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     title:
 *                       type: string
 *                     subtitle:
 *                       type: string
 *                       nullable: true
 *                     teaser:
 *                       type: string
 *                     genre:
 *                       type: string
 *                     estimatedDurationMinutes:
 *                       type: integer
 *                     isFree:
 *                       type: boolean
 *                     coverImageUrl:
 *                       type: string
 *                       nullable: true
 *                     thumbnailUrl:
 *                       type: string
 *                       nullable: true
 *                     opening:
 *                       type: string
 *                       description: The opening narration shown on the story start screen.
 *                     objective:
 *                       type: string
 *                       description: The goal the player must resolve.
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get('/:storyId', authenticate, async (req, res) => {
  await DIContainer.getInstance().getStoryController().getById(req, res);
});

export default router;
