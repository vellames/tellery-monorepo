import { Subscription } from '@prisma/client';
import {
  IPlanRepository,
  ISubscriptionRepository,
  IUserRepository,
} from '../../interfaces';
import { RevenueCatWebhookEvent } from '../../types/domain/subscription/revenuecat-webhook.types';

/**
 * Standalone RevenueCat webhook processor. Runs entirely parallel to
 * SubscriptionService (Stripe) — it reuses the same Subscription/Plan/
 * CreditGrant tables via the `provider: 'revenuecat'` discriminator, but
 * never touches Stripe-specific logic.
 *
 * RevenueCat's `app_user_id` is set to our own `User.id` by the mobile app
 * (see `Purchases.logIn(user.id)`), so subscriptions are resolved directly
 * via `findByUserId` — no separate identity-mapping table is needed.
 */
export class RevenueCatWebhookService {
  constructor(
    private readonly subscriptions: ISubscriptionRepository,
    private readonly plans: IPlanRepository,
    private readonly users: IUserRepository
  ) {}

  async handleEvent(event: RevenueCatWebhookEvent): Promise<void> {
    const userId = event.app_user_id;
    if (!userId) return;

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
        await this.handleActivePurchase(userId, event);
        break;
      case 'PRODUCT_CHANGE':
        await this.handleProductChange(userId, event);
        break;
      case 'CANCELLATION':
        await this.handleCancellation(userId);
        break;
      case 'EXPIRATION':
        await this.handleExpiration(userId);
        break;
      case 'BILLING_ISSUE':
        await this.updateStatusIfExists(userId, 'past_due');
        break;
      case 'SUBSCRIPTION_PAUSED':
        await this.updateStatusIfExists(userId, 'paused');
        break;
      default:
        break;
    }
  }

  private async findOrCreateSubscription(
    userId: string
  ): Promise<Subscription> {
    const existing = await this.subscriptions.findByUserId(userId);
    if (existing) return existing;
    return this.subscriptions.create({
      userId,
      provider: 'revenuecat',
      status: 'incomplete',
    });
  }

  private async handleActivePurchase(
    userId: string,
    event: RevenueCatWebhookEvent
  ): Promise<void> {
    const subscription = await this.findOrCreateSubscription(userId);
    const productId = event.product_id ?? undefined;
    const plan = productId
      ? await this.plans.findByRevenueCatProductId(productId)
      : null;

    await this.subscriptions.update(subscription.id, {
      provider: 'revenuecat',
      planId: plan?.id ?? subscription.planId,
      status: 'active',
      revenueCatOriginalTransactionId:
        event.original_transaction_id ??
        subscription.revenueCatOriginalTransactionId,
      currentPeriodStart: event.purchased_at_ms
        ? new Date(event.purchased_at_ms)
        : subscription.currentPeriodStart,
      currentPeriodEnd: event.expiration_at_ms
        ? new Date(event.expiration_at_ms)
        : subscription.currentPeriodEnd,
      cancelAtPeriodEnd: false,
    });

    if (!plan) return;

    await this.subscriptions.runTransaction(async (tx) => {
      const granted = await this.subscriptions.grantCreditsIdempotentRevenueCat(
        {
          subscriptionId: subscription.id,
          userId,
          revenueCatEventId: event.id,
          credits: plan.creditsPerCycle,
        },
        tx
      );
      if (granted) {
        await this.users.setAvailableCredits(userId, plan.creditsPerCycle, tx);
      }
    });
  }

  private async handleProductChange(
    userId: string,
    event: RevenueCatWebhookEvent
  ): Promise<void> {
    const existing = await this.subscriptions.findByUserId(userId);
    if (!existing) return;

    const nextProductId = event.new_product_id ?? event.product_id ?? undefined;
    const plan = nextProductId
      ? await this.plans.findByRevenueCatProductId(nextProductId)
      : null;

    await this.subscriptions.update(existing.id, {
      planId: plan?.id ?? existing.planId,
      status: 'active',
    });
  }

  private async handleCancellation(userId: string): Promise<void> {
    const existing = await this.subscriptions.findByUserId(userId);
    if (!existing) return;

    await this.subscriptions.update(existing.id, {
      cancelAtPeriodEnd: true,
    });
  }

  private async handleExpiration(userId: string): Promise<void> {
    const existing = await this.subscriptions.findByUserId(userId);
    if (!existing) return;

    await this.subscriptions.update(existing.id, {
      status: 'canceled',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
  }

  private async updateStatusIfExists(
    userId: string,
    status: Subscription['status']
  ): Promise<void> {
    const existing = await this.subscriptions.findByUserId(userId);
    if (!existing) return;

    await this.subscriptions.update(existing.id, { status });
  }
}
