import { Router } from 'express';
import { DIContainer } from '../../container/di.container';

const router = Router();

/**
 * @openapi
 * /subscriptions/webhook/revenuecat:
 *   post:
 *     tags: [Subscriptions]
 *     summary: RevenueCat webhook receiver
 *     description: Receives RevenueCat webhook events and synchronizes local subscription state (parallel to the Stripe webhook — additive only, does not affect Stripe-provider subscriptions). Grants monthly credits on INITIAL_PURCHASE/RENEWAL/UNCANCELLATION. Verified via a static Authorization header configured on the RevenueCat dashboard (no signature/HMAC).
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: RevenueCat webhook event payload.
 *             properties:
 *               api_version: { type: string, example: '1.0' }
 *               event:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   type: { type: string, example: INITIAL_PURCHASE }
 *                   app_user_id: { type: string, description: Our internal User.id (set via Purchases.logIn on the client). }
 *                   product_id: { type: string, nullable: true }
 *                   new_product_id: { type: string, nullable: true }
 *                   original_transaction_id: { type: string, nullable: true }
 *                   purchased_at_ms: { type: integer, nullable: true }
 *                   expiration_at_ms: { type: integer, nullable: true }
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
 *         description: Malformed payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       401:
 *         description: Missing or invalid Authorization header
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.post('/webhook/revenuecat', async (req, res) => {
  await DIContainer.getInstance()
    .getRevenueCatWebhookController()
    .handleWebhook(req, res);
});

export default router;
