import Stripe from 'stripe';
import { Plan, Subscription } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IPlanRepository,
  IStripeService,
  ISubscriptionRepository,
  IUserRepository,
} from '../../../interfaces';
import { SubscriptionService } from '../subscription.service';
import { HttpError } from '../../../utils/http-error';
import { StatusCodes } from 'http-status-codes';

const buildStripeSubscription = (
  overrides: Partial<Stripe.Subscription> = {}
): Stripe.Subscription =>
  ({
    id: 'sub_stripe_1',
    object: 'subscription',
    status: 'active',
    customer: 'cus_123',
    cancel_at_period_end: false,
    items: {
      object: 'list',
      data: [
        {
          id: 'si_1',
          object: 'subscription_item',
          price: { id: 'price_1' } as Stripe.Price,
          current_period_start: 1000,
          current_period_end: 2000,
          quantity: 1,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: '',
    } as unknown as Stripe.ApiList<Stripe.SubscriptionItem>,
    ...overrides,
  }) as Stripe.Subscription;

const mockSubscription = (
  overrides: Partial<Subscription> = {}
): Subscription => ({
  id: 'sub-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  userId: 'user-1',
  planId: null,
  stripeCustomerId: 'cus_123',
  stripeSubscriptionId: 'sub_stripe_1',
  stripePriceId: 'price_1',
  status: 'active',
  currentPeriodStart: new Date('2026-01-01'),
  currentPeriodEnd: new Date('2026-02-01'),
  cancelAtPeriodEnd: false,
  ...overrides,
});

const mockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  stripePriceId: 'price_1',
  name: 'Mensal',
  creditsPerCycle: 20,
  interval: 'month',
  active: true,
  ...overrides,
});

describe('SubscriptionService', () => {
  let subscriptions: DeepMockProxy<ISubscriptionRepository>;
  let plans: DeepMockProxy<IPlanRepository>;
  let users: DeepMockProxy<IUserRepository>;
  let stripe: DeepMockProxy<IStripeService>;
  let service: SubscriptionService;

  beforeEach(() => {
    subscriptions = mockDeep<ISubscriptionRepository>();
    plans = mockDeep<IPlanRepository>();
    users = mockDeep<IUserRepository>();
    stripe = mockDeep<IStripeService>();
    subscriptions.runTransaction.mockImplementation(async (cb) =>
      cb({} as never)
    );
    service = new SubscriptionService(subscriptions, plans, users, stripe, {
      monthlyPriceId: 'price_1',
      webBaseUrl: 'http://localhost:3000',
    });
  });

  afterEach(() => {
    mockReset(subscriptions);
    mockReset(plans);
    mockReset(users);
    mockReset(stripe);
  });

  describe('getPlanDisplay', () => {
    it('should hydrate the plan with live price details from stripe', async () => {
      plans.findActive.mockResolvedValue(mockPlan());
      stripe.retrievePrice.mockResolvedValue({
        id: 'price_1',
        currency: 'brl',
        unit_amount: 1990,
        recurring: { interval: 'month' },
      } as Stripe.Price);

      const result = await service.getPlanDisplay();

      expect(result).toEqual({
        id: 'plan-1',
        name: 'Mensal',
        creditsPerCycle: 20,
        interval: 'month',
        priceId: 'price_1',
        amountInCents: 1990,
        currency: 'brl',
        active: true,
      });
    });

    it('should return null when no active plan is seeded', async () => {
      plans.findActive.mockResolvedValue(null);
      expect(await service.getPlanDisplay()).toBeNull();
    });
  });

  describe('getSubscription', () => {
    it('should return the subscription dto with plan info', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());
      plans.findByStripePriceId.mockResolvedValue(mockPlan());

      const result = await service.getSubscription('user-1');

      expect(result).toMatchObject({
        id: 'sub-1',
        status: 'active',
        planName: 'Mensal',
        creditsPerCycle: 20,
        cancelAtPeriodEnd: false,
      });
    });

    it('should return null when the user has no subscription', async () => {
      subscriptions.findByUserId.mockResolvedValue(null);
      expect(await service.getSubscription('user-1')).toBeNull();
    });
  });

  describe('createCheckoutSession', () => {
    it('should throw 500 when no price is configured', async () => {
      const noConfigService = new SubscriptionService(
        subscriptions,
        plans,
        users,
        stripe,
        { monthlyPriceId: undefined, webBaseUrl: 'http://localhost:3000' }
      );
      users.findById.mockResolvedValue({ id: 'user-1' } as never);

      await expect(
        noConfigService.createCheckoutSession('user-1')
      ).rejects.toThrow(HttpError);
    });

    it('should throw 404 when the user does not exist', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession('user-1')
      ).rejects.toMatchObject({ statusCode: StatusCodes.NOT_FOUND });
    });

    it('should create a customer + local row when none exists', async () => {
      users.findById.mockResolvedValue({
        id: 'user-1',
        name: 'Ana',
        email: 'ana@teste.local',
      } as never);
      subscriptions.findByUserId.mockResolvedValue(null);
      stripe.createCustomer.mockResolvedValue({ id: 'cus_new' } as never);
      subscriptions.create.mockResolvedValue(
        mockSubscription({ stripeCustomerId: 'cus_new', status: 'incomplete' })
      );
      stripe.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_1',
      } as never);

      const result = await service.createCheckoutSession('user-1');

      expect(stripe.createCustomer).toHaveBeenCalledWith({
        email: 'ana@teste.local',
        name: 'Ana',
        userId: 'user-1',
      });
      expect(subscriptions.create).toHaveBeenCalledWith({
        userId: 'user-1',
        stripeCustomerId: 'cus_new',
        status: 'incomplete',
      });
      expect(result.url).toBe('https://checkout.stripe.com/session_1');
    });

    it('should reuse the existing customer when a subscription row exists', async () => {
      users.findById.mockResolvedValue({ id: 'user-1' } as never);
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());
      stripe.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_2',
      } as never);

      await service.createCheckoutSession('user-1');

      expect(stripe.createCustomer).not.toHaveBeenCalled();
      expect(stripe.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cus_123', priceId: 'price_1' })
      );
    });
  });

  describe('createBillingPortalSession', () => {
    it('should throw 404 when no subscription exists', async () => {
      subscriptions.findByUserId.mockResolvedValue(null);

      await expect(
        service.createBillingPortalSession('user-1')
      ).rejects.toMatchObject({ statusCode: StatusCodes.NOT_FOUND });
    });

    it('should return the portal url', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());
      stripe.createBillingPortalSession.mockResolvedValue({
        url: 'https://billing.stripe.com/p_1',
      } as never);

      const result = await service.createBillingPortalSession('user-1');

      expect(stripe.createBillingPortalSession).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cus_123' })
      );
      expect(result.url).toBe('https://billing.stripe.com/p_1');
    });
  });

  describe('handleWebhook', () => {
    it('should update the existing row on checkout.session.completed', async () => {
      const session = {
        client_reference_id: 'user-1',
        customer: 'cus_123',
        subscription: 'sub_stripe_1',
      } as Stripe.Checkout.Session;
      stripe.constructWebhookEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event);
      stripe.retrieveSubscription.mockResolvedValue(buildStripeSubscription());
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        mockSubscription()
      );

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(subscriptions.update).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({
          stripeSubscriptionId: 'sub_stripe_1',
          stripePriceId: 'price_1',
          status: 'active',
        })
      );
    });

    it('should sync the subscription on customer.subscription.updated', async () => {
      stripe.constructWebhookEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: buildStripeSubscription({ status: 'past_due' }) },
      } as Stripe.Event);
      subscriptions.findByStripeSubscriptionId.mockResolvedValue(
        mockSubscription()
      );

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(subscriptions.update).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({ status: 'past_due' })
      );
    });

    it('should mark the subscription canceled on customer.subscription.deleted', async () => {
      stripe.constructWebhookEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: buildStripeSubscription() },
      } as Stripe.Event);
      subscriptions.findByStripeSubscriptionId.mockResolvedValue(
        mockSubscription()
      );

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(subscriptions.update).toHaveBeenCalledWith('sub-1', {
        status: 'canceled',
        cancelAtPeriodEnd: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      });
    });

    it('should grant credits on invoice.paid (subscription_create)', async () => {
      const invoice = {
        id: 'in_1',
        billing_reason: 'subscription_create',
        customer: 'cus_123',
        lines: {
          object: 'list',
          data: [{ subscription: 'sub_stripe_1' }],
        },
      } as unknown as Stripe.Invoice;
      stripe.constructWebhookEvent.mockReturnValue({
        type: 'invoice.paid',
        data: { object: invoice },
      } as Stripe.Event);
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        mockSubscription()
      );
      plans.findByStripePriceId.mockResolvedValue(mockPlan());
      subscriptions.grantCreditsIdempotent.mockResolvedValue(true);

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(subscriptions.grantCreditsIdempotent).toHaveBeenCalledWith(
        {
          subscriptionId: 'sub-1',
          userId: 'user-1',
          stripeInvoiceId: 'in_1',
          credits: 20,
        },
        expect.anything()
      );
      expect(users.addCredits).toHaveBeenCalledWith(
        'user-1',
        20,
        expect.anything()
      );
    });

    it('should not grant credits twice for the same invoice', async () => {
      const invoice = {
        id: 'in_1',
        billing_reason: 'subscription_cycle',
        customer: 'cus_123',
        lines: { object: 'list', data: [] },
      } as unknown as Stripe.Invoice;
      stripe.constructWebhookEvent.mockReturnValue({
        type: 'invoice.paid',
        data: { object: invoice },
      } as Stripe.Event);
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        mockSubscription()
      );
      plans.findByStripePriceId.mockResolvedValue(mockPlan());
      subscriptions.grantCreditsIdempotent.mockResolvedValue(false);

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(users.addCredits).not.toHaveBeenCalled();
    });

    it('should ignore non-grantable billing reasons', async () => {
      const invoice = {
        id: 'in_1',
        billing_reason: 'manual',
        customer: 'cus_123',
        lines: { object: 'list', data: [] },
      } as unknown as Stripe.Invoice;
      stripe.constructWebhookEvent.mockReturnValue({
        type: 'invoice.paid',
        data: { object: invoice },
      } as Stripe.Event);

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(subscriptions.grantCreditsIdempotent).not.toHaveBeenCalled();
    });

    it('should ignore unknown event types', async () => {
      stripe.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: {} },
      } as Stripe.Event);

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(subscriptions.update).not.toHaveBeenCalled();
      expect(subscriptions.grantCreditsIdempotent).not.toHaveBeenCalled();
    });
  });
});
