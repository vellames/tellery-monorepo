import { Plan, Subscription } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IPlanRepository,
  ISubscriptionRepository,
  IUserRepository,
} from '../../../interfaces';
import { RevenueCatWebhookService } from '../revenuecat-webhook.service';
import { RevenueCatWebhookEvent } from '../../../types/domain/subscription/revenuecat-webhook.types';

const mockSubscription = (
  overrides: Partial<Subscription> = {}
): Subscription => ({
  id: 'sub-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  userId: 'user-1',
  planId: null,
  provider: 'revenuecat',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  revenueCatOriginalTransactionId: null,
  status: 'incomplete',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  ...overrides,
});

const mockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  stripePriceId: 'price_1',
  revenueCatProductId: 'monthly',
  name: 'Mensal',
  creditsPerCycle: 20,
  interval: 'month',
  active: true,
  ...overrides,
});

const baseEvent: RevenueCatWebhookEvent = {
  id: 'evt_1',
  type: 'INITIAL_PURCHASE',
  app_user_id: 'user-1',
  product_id: 'monthly',
  original_transaction_id: 'orig_txn_1',
  purchased_at_ms: 1_700_000_000_000,
  expiration_at_ms: 1_702_600_000_000,
};

describe('RevenueCatWebhookService', () => {
  let subscriptions: DeepMockProxy<ISubscriptionRepository>;
  let plans: DeepMockProxy<IPlanRepository>;
  let users: DeepMockProxy<IUserRepository>;
  let service: RevenueCatWebhookService;

  beforeEach(() => {
    subscriptions = mockDeep<ISubscriptionRepository>();
    plans = mockDeep<IPlanRepository>();
    users = mockDeep<IUserRepository>();
    service = new RevenueCatWebhookService(subscriptions, plans, users);

    subscriptions.runTransaction.mockImplementation(async (cb) =>
      cb({} as never)
    );
  });

  afterEach(() => {
    mockReset(subscriptions);
    mockReset(plans);
    mockReset(users);
  });

  it('should ignore events with no app_user_id', async () => {
    await service.handleEvent({ ...baseEvent, app_user_id: '' });

    expect(subscriptions.findByUserId).not.toHaveBeenCalled();
  });

  describe('INITIAL_PURCHASE / RENEWAL / UNCANCELLATION', () => {
    it.each(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION'] as const)(
      'activates the subscription and grants credits for %s',
      async (type) => {
        const existing = mockSubscription();
        subscriptions.findByUserId.mockResolvedValue(existing);
        plans.findByRevenueCatProductId.mockResolvedValue(mockPlan());
        subscriptions.grantCreditsIdempotentRevenueCat.mockResolvedValue(true);

        await service.handleEvent({ ...baseEvent, type });

        expect(subscriptions.update).toHaveBeenCalledWith(
          'sub-1',
          expect.objectContaining({
            provider: 'revenuecat',
            planId: 'plan-1',
            status: 'active',
            revenueCatOriginalTransactionId: 'orig_txn_1',
            cancelAtPeriodEnd: false,
          })
        );
        expect(
          subscriptions.grantCreditsIdempotentRevenueCat
        ).toHaveBeenCalledWith(
          {
            subscriptionId: 'sub-1',
            userId: 'user-1',
            revenueCatEventId: 'evt_1',
            credits: 20,
          },
          expect.anything()
        );
        expect(users.setAvailableCredits).toHaveBeenCalledWith(
          'user-1',
          20,
          expect.anything()
        );
      }
    );

    it('creates a new subscription when none exists yet', async () => {
      subscriptions.findByUserId.mockResolvedValue(null);
      subscriptions.create.mockResolvedValue(mockSubscription());
      plans.findByRevenueCatProductId.mockResolvedValue(mockPlan());
      subscriptions.grantCreditsIdempotentRevenueCat.mockResolvedValue(true);

      await service.handleEvent(baseEvent);

      expect(subscriptions.create).toHaveBeenCalledWith({
        userId: 'user-1',
        provider: 'revenuecat',
        status: 'incomplete',
      });
      expect(subscriptions.update).toHaveBeenCalled();
    });

    it('does not grant credits again when already granted (idempotent)', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());
      plans.findByRevenueCatProductId.mockResolvedValue(mockPlan());
      subscriptions.grantCreditsIdempotentRevenueCat.mockResolvedValue(false);

      await service.handleEvent(baseEvent);

      expect(users.setAvailableCredits).not.toHaveBeenCalled();
    });

    it('updates status without granting credits when the plan cannot be resolved', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());
      plans.findByRevenueCatProductId.mockResolvedValue(null);

      await service.handleEvent(baseEvent);

      expect(subscriptions.update).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({ status: 'active' })
      );
      expect(
        subscriptions.grantCreditsIdempotentRevenueCat
      ).not.toHaveBeenCalled();
    });
  });

  describe('PRODUCT_CHANGE', () => {
    it('re-resolves the plan by the new product id and keeps the subscription active', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());
      plans.findByRevenueCatProductId.mockResolvedValue(
        mockPlan({ id: 'plan-2', revenueCatProductId: 'annual' })
      );

      await service.handleEvent({
        ...baseEvent,
        type: 'PRODUCT_CHANGE',
        product_id: 'monthly',
        new_product_id: 'annual',
      });

      expect(plans.findByRevenueCatProductId).toHaveBeenCalledWith('annual');
      expect(subscriptions.update).toHaveBeenCalledWith('sub-1', {
        planId: 'plan-2',
        status: 'active',
      });
    });

    it('does nothing when the subscription does not exist', async () => {
      subscriptions.findByUserId.mockResolvedValue(null);

      await service.handleEvent({ ...baseEvent, type: 'PRODUCT_CHANGE' });

      expect(subscriptions.update).not.toHaveBeenCalled();
    });
  });

  describe('CANCELLATION', () => {
    it('sets cancelAtPeriodEnd without changing status', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());

      await service.handleEvent({ ...baseEvent, type: 'CANCELLATION' });

      expect(subscriptions.update).toHaveBeenCalledWith('sub-1', {
        cancelAtPeriodEnd: true,
      });
    });
  });

  describe('EXPIRATION', () => {
    it('marks the subscription canceled and clears period dates', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());

      await service.handleEvent({ ...baseEvent, type: 'EXPIRATION' });

      expect(subscriptions.update).toHaveBeenCalledWith('sub-1', {
        status: 'canceled',
        cancelAtPeriodEnd: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      });
    });
  });

  describe('BILLING_ISSUE', () => {
    it('sets status to past_due', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());

      await service.handleEvent({ ...baseEvent, type: 'BILLING_ISSUE' });

      expect(subscriptions.update).toHaveBeenCalledWith('sub-1', {
        status: 'past_due',
      });
    });
  });

  describe('SUBSCRIPTION_PAUSED', () => {
    it('sets status to paused', async () => {
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());

      await service.handleEvent({
        ...baseEvent,
        type: 'SUBSCRIPTION_PAUSED',
      });

      expect(subscriptions.update).toHaveBeenCalledWith('sub-1', {
        status: 'paused',
      });
    });
  });

  describe('unrecognized event types', () => {
    it('does nothing', async () => {
      await service.handleEvent({ ...baseEvent, type: 'SUBSCRIBER_ALIAS' });

      expect(subscriptions.findByUserId).not.toHaveBeenCalled();
      expect(subscriptions.update).not.toHaveBeenCalled();
    });
  });
});
