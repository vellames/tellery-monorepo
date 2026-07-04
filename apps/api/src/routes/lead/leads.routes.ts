import { Router } from 'express';
import { DIContainer } from '../../container/di.container';

const router = Router();

/**
 * @openapi
 * /leads:
 *   post:
 *     tags: [Leads]
 *     summary: Create or reuse an active registration lead
 *     description: Finds an active (non-converted, non-deleted) lead for the given localUuid and returns it; creates a new one when none exists. Used to track the registration funnel per browser. No authentication required.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [localUuid]
 *             properties:
 *               localUuid:
 *                 type: string
 *                 description: Browser-local identifier persisted in localStorage. Not unique — used only to group a single browser's funnel.
 *                 example: 11111111-2222-3333-4444-555555555555
 *               queryParams:
 *                 type: string
 *                 description: Raw query string captured on the register page (e.g. UTM/referrer params). Stored opaquely.
 *                 example: ?utm_source=newsletter&utm_medium=email
 *     responses:
 *       201:
 *         description: The active or newly created lead
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *       422:
 *         description: Invalid request body (missing localUuid)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.post('/', async (req, res) => {
  await DIContainer.getInstance().getLeadController().create(req, res);
});

/**
 * @openapi
 * /leads/{id}:
 *   patch:
 *     tags: [Leads]
 *     summary: Update funnel milestones on a lead
 *     description: Updates the tracked registration-funnel fields (name, email, password-field touches, privacy/terms acceptance) for a lead. The userId field is intentionally not settable here — it is linked server-side when registration completes. No authentication required.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The lead id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, nullable: true }
 *               email: { type: string, nullable: true }
 *               isPasswordTouched: { type: boolean, example: true }
 *               isConfirmPasswordTouched: { type: boolean, example: true }
 *               isPrivacyAccepted: { type: boolean, example: true }
 *               isTermsAccepted: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: The updated lead
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *       404:
 *         description: Lead not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       422:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.patch('/:id', async (req, res) => {
  await DIContainer.getInstance().getLeadController().update(req, res);
});

export default router;
