import { Router, RequestHandler } from 'express';
import { DIContainer } from '../../container/di.container';

const router = Router();

const authenticate: RequestHandler = (req, res, next) => {
  DIContainer.getInstance().getAuthMiddleware()(req, res, next);
};

/**
 * @openapi
 * /subscriptions/plan:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get the active subscription plan
 *     description: Returns the active plan with price details fetched live from Stripe (amount, currency). Null when no plan is seeded.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: The active plan (or null)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string, example: Mensal }
 *                     creditsPerCycle: { type: integer, example: 20 }
 *                     interval: { type: string, example: month }
 *                     priceId: { type: string, example: price_123 }
 *                     amountInCents: { type: integer, example: 1990 }
 *                     currency: { type: string, example: brl }
 *                     active: { type: boolean, example: true }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.get('/plan', authenticate, async (req, res) => {
  await DIContainer.getInstance().getSubscriptionController().getPlan(req, res);
});

/**
 * @openapi
 * /subscriptions:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get the logged-in user's subscription
 *     description: Returns the authenticated user's subscription state (mirrored from Stripe). Null when the user has never subscribed. Pass sync=1 to refresh the local state from Stripe before returning (use where fresh display state matters, e.g. after canceling).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: sync
 *         in: query
 *         required: false
 *         schema: { type: string, enum: ['1'], example: '1' }
 *         description: When '1', pulls the latest subscription state from Stripe before responding.
 *     responses:
 *       200:
 *         description: The user's subscription (or null)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     status: { type: string, example: active }
 *                     planName: { type: string, nullable: true, example: Mensal }
 *                     creditsPerCycle: { type: integer, nullable: true, example: 20 }
 *                     stripePriceId: { type: string, nullable: true }
 *                     currentPeriodStart: { type: string, format: date-time, nullable: true }
 *                     currentPeriodEnd: { type: string, format: date-time, nullable: true }
 *                     cancelAtPeriodEnd: { type: boolean, example: false }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.get('/', authenticate, async (req, res) => {
  await DIContainer.getInstance()
    .getSubscriptionController()
    .getSubscription(req, res);
});

/**
 * @openapi
 * /subscriptions/checkout:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a Stripe Checkout Session
 *     description: Finds-or-creates a Stripe Customer for the authenticated user, then creates a subscription-mode Checkout Session. Requires an SSN/CPF on the user's profile (collects billing address on Stripe's side). Returns the hosted URL to redirect to.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priceId:
 *                 type: string
 *                 description: Optional price id override (defaults to the configured monthly price).
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string, format: uri }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       422:
 *         description: Invalid request body, or the user has no SSN/CPF on file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Stripe price not configured or checkout creation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.post('/checkout', authenticate, async (req, res) => {
  await DIContainer.getInstance()
    .getSubscriptionController()
    .createCheckoutSession(req, res);
});

/**
 * @openapi
 * /subscriptions/portal:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a Stripe Billing Portal Session
 *     description: Returns a URL to the Stripe Customer Portal so the user can manage their card, cancel, or view invoices.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Portal session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string, format: uri }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       404:
 *         description: No active subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.post('/portal', authenticate, async (req, res) => {
  await DIContainer.getInstance()
    .getSubscriptionController()
    .createBillingPortalSession(req, res);
});

/**
 * @openapi
 * /subscriptions/webhook:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Stripe webhook receiver
 *     description: Receives Stripe webhook events (raw body) and synchronizes local subscription state. Grants monthly credits on invoice.paid. No authentication — verified via the Stripe signature header.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe event payload (verified via the stripe-signature header).
 *     responses:
 *       200:
 *         description: Event processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     received: { type: boolean, example: true }
 *       400:
 *         description: Invalid signature or payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.post('/webhook', async (req, res) => {
  await DIContainer.getInstance()
    .getSubscriptionController()
    .handleWebhook(req, res);
});

export default router;
