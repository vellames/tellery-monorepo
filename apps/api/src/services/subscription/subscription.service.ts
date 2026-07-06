import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import { Subscription, SubscriptionStatus } from '@prisma/client';
import {
  IPlanRepository,
  IStripeService,
  ISubscriptionRepository,
  IUserRepository,
} from '../../interfaces';
import {
  BillingPortalResponseDto,
  CheckoutSessionResponseDto,
  PlanDisplayDto,
  SubscriptionResponseDto,
} from '../../types/domain/subscription/subscription.dto';
import { HttpError } from '../../utils/http-error';

export interface SubscriptionServiceConfig {
  monthlyPriceId: string | undefined;
  webBaseUrl: string;
}

const GRANTABLE_BILLING_REASONS = new Set<string>([
  'subscription_create',
  'subscription_cycle',
]);

export class SubscriptionService {
  constructor(
    private readonly subscriptions: ISubscriptionRepository,
    private readonly plans: IPlanRepository,
    private readonly users: IUserRepository,
    private readonly stripe: IStripeService,
    private readonly config: SubscriptionServiceConfig
  ) {}

  async getPlanDisplay(): Promise<PlanDisplayDto | null> {
    const plan = await this.plans.findActive();
    if (!plan) {
      return null;
    }

    const price = await this.stripe.retrievePrice(plan.stripePriceId);
    return {
      id: plan.id,
      name: plan.name,
      creditsPerCycle: plan.creditsPerCycle,
      interval: price.recurring?.interval ?? plan.interval,
      priceId: price.id,
      amountInCents: price.unit_amount ?? 0,
      currency: price.currency,
      active: plan.active,
    };
  }

  async getSubscription(
    userId: string,
    syncFromStripe = false
  ): Promise<SubscriptionResponseDto | null> {
    if (syncFromStripe) {
      await this.syncFromStripe(userId).catch(() => {});
    }

    const sub = await this.subscriptions.findByUserId(userId);
    if (!sub) {
      return null;
    }

    let planName: string | null = null;
    let creditsPerCycle: number | null = null;
    if (sub.stripePriceId) {
      const plan = await this.plans.findByStripePriceId(sub.stripePriceId);
      if (plan) {
        planName = plan.name;
        creditsPerCycle = plan.creditsPerCycle;
      }
    }

    return this.toResponseDto(sub, planName, creditsPerCycle);
  }

  async createCheckoutSession(
    userId: string,
    priceIdOverride?: string
  ): Promise<CheckoutSessionResponseDto> {
    const priceId = priceIdOverride ?? this.config.monthlyPriceId;
    if (!priceId) {
      throw new HttpError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Stripe monthly price is not configured',
        'subscription:errors.notConfigured'
      );
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'User not found',
        'user:errors.userNotFound'
      );
    }

    if (!user.emailVerifiedAt) {
      throw new HttpError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'Email is not verified',
        'subscription:errors.emailNotVerified'
      );
    }

    if (!user.ssn) {
      throw new HttpError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'User has no SSN',
        'subscription:errors.missingSsn'
      );
    }

    let subscription = await this.subscriptions.findByUserId(userId);
    if (!subscription) {
      const customer = await this.stripe.createCustomer({
        email: user.email ?? '',
        name: user.name,
        userId,
      });
      subscription = await this.subscriptions.create({
        userId,
        stripeCustomerId: customer.id,
        status: 'incomplete',
      });
    }

    const successUrl = `${this.config.webBaseUrl}/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.config.webBaseUrl}/subscription?status=cancel`;

    const session = await this.stripe.createCheckoutSession({
      // stripeCustomerId is always populated for Stripe-created subscriptions
      // (set above); it's only nullable to support RevenueCat subscriptions.
      customerId: subscription.stripeCustomerId!,
      userId,
      priceId,
      successUrl,
      cancelUrl,
    });

    if (!session.url) {
      throw new HttpError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to create checkout session',
        'subscription:errors.checkoutFailed'
      );
    }

    return { url: session.url };
  }

  async createBillingPortalSession(
    userId: string
  ): Promise<BillingPortalResponseDto> {
    const subscription = await this.subscriptions.findByUserId(userId);
    if (!subscription) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'No active subscription',
        'subscription:errors.noActiveSubscription'
      );
    }

    const returnUrl = `${this.config.webBaseUrl}/subscription`;
    const session = await this.stripe.createBillingPortalSession({
      // stripeCustomerId is always populated for Stripe-created subscriptions;
      // it's only nullable to support RevenueCat subscriptions.
      customerId: subscription.stripeCustomerId!,
      returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhook(
    rawBody: Buffer,
    signature: string | string[]
  ): Promise<void> {
    const event = this.stripe.constructWebhookEvent(rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const userId = session.client_reference_id;
    const customerId =
      typeof session.customer === 'string' ? session.customer : null;
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : null;

    if (!customerId || !subscriptionId || !userId) {
      return;
    }

    const stripeSubscription =
      await this.stripe.retrieveSubscription(subscriptionId);
    const priceId = stripeSubscription.items.data[0]?.price?.id ?? null;
    const plan = priceId ? await this.plans.findByStripePriceId(priceId) : null;

    const existing =
      (await this.subscriptions.findByStripeCustomerId(customerId)) ??
      (await this.subscriptions.findByUserId(userId));

    const { start, end } = this.periodDates(stripeSubscription);

    const payload = {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      planId: plan?.id ?? null,
      status: stripeSubscription.status as SubscriptionStatus,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    };

    if (existing) {
      await this.subscriptions.update(existing.id, payload);
    } else {
      await this.subscriptions.create({
        userId,
        stripeCustomerId: customerId,
        status: stripeSubscription.status as SubscriptionStatus,
      });
    }
  }

  async syncFromStripe(userId: string): Promise<void> {
    const local = await this.subscriptions.findByUserId(userId);
    if (!local || !local.stripeSubscriptionId) {
      return;
    }
    const stripeSubscription = await this.stripe.retrieveSubscription(
      local.stripeSubscriptionId
    );
    await this.applySubscriptionUpdate(local.id, stripeSubscription);
  }

  private async applySubscriptionUpdate(
    localId: string,
    subscription: Stripe.Subscription
  ): Promise<void> {
    const priceId = subscription.items.data[0]?.price?.id ?? null;
    const plan = priceId ? await this.plans.findByStripePriceId(priceId) : null;

    const { start, end } = this.periodDates(subscription);

    await this.subscriptions.update(localId, {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      planId: plan?.id ?? null,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: subscription.cancel_at !== null,
    });
  }

  private async syncSubscription(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : null;

    const existing =
      (await this.subscriptions.findByStripeSubscriptionId(subscription.id)) ??
      (customerId
        ? await this.subscriptions.findByStripeCustomerId(customerId)
        : null);

    if (!existing) {
      return;
    }

    await this.applySubscriptionUpdate(existing.id, subscription);
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const existing = await this.subscriptions.findByStripeSubscriptionId(
      subscription.id
    );
    if (!existing) {
      return;
    }

    await this.subscriptions.update(existing.id, {
      status: 'canceled',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const billingReason = invoice.billing_reason;
    if (!billingReason || !GRANTABLE_BILLING_REASONS.has(billingReason)) {
      return;
    }

    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : null;
    const invoiceId = invoice.id;

    if (!customerId || !invoiceId) {
      return;
    }

    const subscription =
      await this.subscriptions.findByStripeCustomerId(customerId);
    if (!subscription) {
      return;
    }

    let priceId = subscription.stripePriceId;
    if (!priceId) {
      const subscriptionRef = invoice.lines.data[0]?.subscription;
      const subscriptionStripeId =
        typeof subscriptionRef === 'string' ? subscriptionRef : null;
      if (subscriptionStripeId) {
        const fresh =
          await this.stripe.retrieveSubscription(subscriptionStripeId);
        priceId = fresh.items.data[0]?.price?.id ?? null;
      }
    }

    if (!priceId) {
      return;
    }

    const plan = await this.plans.findByStripePriceId(priceId);
    if (!plan) {
      return;
    }

    await this.subscriptions.runTransaction(async (tx) => {
      const granted = await this.subscriptions.grantCreditsIdempotent(
        {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          stripeInvoiceId: invoiceId,
          credits: plan.creditsPerCycle,
        },
        tx
      );
      if (granted) {
        await this.users.setAvailableCredits(
          subscription.userId,
          plan.creditsPerCycle,
          tx
        );
      }
    });
  }

  private periodDates(subscription: Stripe.Subscription): {
    start: Date | null;
    end: Date | null;
  } {
    const item = subscription.items.data[0];
    if (!item) {
      return { start: null, end: null };
    }
    return {
      start: new Date(item.current_period_start * 1000),
      end: new Date(item.current_period_end * 1000),
    };
  }

  private toResponseDto(
    sub: Subscription,
    planName: string | null,
    creditsPerCycle: number | null
  ): SubscriptionResponseDto {
    return {
      id: sub.id,
      status: sub.status,
      planName,
      creditsPerCycle,
      stripePriceId: sub.stripePriceId,
      currentPeriodStart: sub.currentPeriodStart
        ? sub.currentPeriodStart.toISOString()
        : null,
      currentPeriodEnd: sub.currentPeriodEnd
        ? sub.currentPeriodEnd.toISOString()
        : null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }
}
