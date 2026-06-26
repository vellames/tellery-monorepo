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
 *                 stateType:
 *                   type: string
 *                   enum: [character, object, location]
 *                   description: The type of the resolved session state.
 *                 reply:
 *                   type: string
 *                   nullable: true
 *                   description: The character's dialogue reply (null for objects and locations).
 *                 detectedIntents:
 *                   type: array
 *                   description: Intents detected from the user's message (empty for location interactions).
 *                   items:
 *                     type: object
 *                     properties:
 *                       intentId:
 *                         type: string
 *                       confidence:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 1
 *                       reasoning:
 *                         type: string
 *                 discoveredClues:
 *                   type: array
 *                   description: Clues discovered during this interaction (object interactions only).
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       reasoning:
 *                         type: string
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ValidationError"
 *       404:
 *         description: Session or state not found
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
 */
router.post('/:sessionId/interact', authenticate, async (req, res) => {
  await DIContainer.getInstance().getSessionController().interact(req, res);
});

/**
 * @openapi
 * /session/{sessionId}:
 *   get:
 *     tags: [Session]
 *     summary: Get the current session state
 *     description: Returns the player-facing state of a session (discovered clues, inspected/visited states, conversation history). Hides game-master data such as reveal rules, secret truths and private knowledge.
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
 *     responses:
 *       200:
 *         description: The current session state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: active
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 history:
 *                   type: object
 *                   properties:
 *                     id:
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
 *                     genre:
 *                       type: string
 *                 clues:
 *                   type: array
 *                   description: Only discovered clues.
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       importance:
 *                         type: string
 *                       discoveredAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                 characters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       role:
 *                         type: string
 *                       shortDescription:
 *                         type: string
 *                       conversationSummary:
 *                         type: string
 *                         nullable: true
 *                       messages:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             role:
 *                               type: string
 *                             content:
 *                               type: string
 *                 objects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       inspected:
 *                         type: boolean
 *                       messages:
 *                         type: array
 *                         items:
 *                           type: object
 *                 locations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       visited:
 *                         type: boolean
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
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get('/:sessionId', authenticate, async (req, res) => {
  await DIContainer.getInstance().getSessionController().getSession(req, res);
});

export default router;
