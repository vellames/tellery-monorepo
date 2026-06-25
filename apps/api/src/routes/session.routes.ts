import { Router, RequestHandler } from 'express';
import { DIContainer } from '../container/di.container';

const router = Router();

const authenticate: RequestHandler = (req, res, next) => {
  DIContainer.getInstance().getAuthMiddleware()(req, res, next);
};

/**
 * @openapi
 * /session/start:
 *   post:
 *     tags: [Session]
 *     summary: Start a new history session
 *     description: Creates and persists a history session for the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               historyId:
 *                 type: string
 *                 description: The history ID to start a session for. Either historyId or historySlug is required.
 *               historySlug:
 *                 type: string
 *                 description: The history slug to start a session for. Used if historyId is omitted or not found.
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   description: The created session state.
 *                 sessionStatus:
 *                   type: string
 *                   example: active
 *                 history:
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
 *                     opening:
 *                       type: string
 *                     objective:
 *                       type: string
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ValidationError"
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: User or history not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post('/start', authenticate, async (req, res) => {
  await DIContainer.getInstance().getSessionController().start(req, res);
});

/**
 * @openapi
 * /session/{sessionId}/interact:
 *   post:
 *     tags: [Session]
 *     summary: Interact with a session
 *     description: Interact with a character, object, or location in a session. Location interactions do not call the LLM; character and object interactions trigger intent detection and agent execution.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID.
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stateId, interaction]
 *             properties:
 *               stateId:
 *                 type: string
 *                 description: The session state ID (character, object, or location state).
 *               interaction:
 *                 type: string
 *                 description: The user's interaction message.
 *     responses:
 *       200:
 *         description: Interaction result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The state ID that was interacted with.
 *                 reply:
 *                   type: string
 *                   nullable: true
 *                   description: The character's reply (null for locations and objects).
 *                 detectedIntents:
 *                   type: array
 *                   items:
 *                     type: object
 *                 characterAgentResult:
 *                   type: object
 *                   nullable: true
 *                 objectAgentDiscoveredClues:
 *                   type: array
 *                   items:
 *                     type: object
 *                 discoveredClues:
 *                   type: array
 *                   items:
 *                     type: object
 *                 sessionStatus:
 *                   type: string
 *                   example: active
 *                 session:
 *                   type: object
 *                   description: The updated session state.
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ValidationError"
 *       404:
 *         description: Session, state, or history not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: The authenticated user does not own this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       502:
 *         description: Intent detection or agent execution failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post('/:sessionId/interact', authenticate, async (req, res) => {
  await DIContainer.getInstance().getSessionController().interact(req, res);
});

export default router;
