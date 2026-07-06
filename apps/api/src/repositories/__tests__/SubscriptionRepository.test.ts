import { PrismaClient, Subscription, Prisma } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SubscriptionRepository } from '../SubscriptionRepository';

const mockSubscription = (
  overrides: Partial<Subscription> = {}
): Subscription => ({
  id: 'sub-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  userId: 'user-1',
  planId: null,
  provider: 'stripe',
  stripeCustomerId: 'cus_123',
  stripeSubscriptionId: 'sub_stripe_1',
  stripePriceId: 'price_1',
  revenueCatOriginalTransactionId: null,
  status: 'active',
  currentPeriodStart: new Date('2026-01-01'),
  currentPeriodEnd: new Date('2026-02-01'),
  cancelAtPeriodEnd: false,
  ...overrides,
});

describe('SubscriptionRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repo: SubscriptionRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new SubscriptionRepository(prisma);
  });

  afterEach(() => {
    mockReset(prisma);
  });

  describe('findByUserId', () => {
    it('should find a non-deleted subscription by user id', async () => {
      const sub = mockSubscription();
      prisma.subscription.findFirst.mockResolvedValue(sub);

      const result = await repo.findByUserId('user-1');

      expect(result).toEqual(sub);
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
      });
    });

    it('should return null when not found', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      expect(await repo.findByUserId('nope')).toBeNull();
    });
  });

  describe('findByStripeCustomerId', () => {
    it('should find by stripe customer id', async () => {
      const sub = mockSubscription();
      prisma.subscription.findFirst.mockResolvedValue(sub);

      const result = await repo.findByStripeCustomerId('cus_123');

      expect(result).toEqual(sub);
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_123', deletedAt: null },
      });
    });
  });

  describe('findByStripeSubscriptionId', () => {
    it('should find by stripe subscription id', async () => {
      const sub = mockSubscription();
      prisma.subscription.findFirst.mockResolvedValue(sub);

      const result = await repo.findByStripeSubscriptionId('sub_stripe_1');

      expect(result).toEqual(sub);
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_stripe_1', deletedAt: null },
      });
    });
  });

  describe('create', () => {
    it('should create a subscription row', async () => {
      const created = mockSubscription({ status: 'incomplete' });
      prisma.subscription.create.mockResolvedValue(created);

      const result = await repo.create({
        userId: 'user-1',
        stripeCustomerId: 'cus_123',
        status: 'incomplete',
      });

      expect(result).toEqual(created);
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          stripeCustomerId: 'cus_123',
          provider: 'stripe',
          revenueCatOriginalTransactionId: undefined,
          status: 'incomplete',
        },
      });
    });

    it('should create a revenuecat-provider subscription without a stripe customer', async () => {
      const created = mockSubscription({
        provider: 'revenuecat',
        stripeCustomerId: null,
        revenueCatOriginalTransactionId: 'rc_txn_1',
        status: 'active',
      });
      prisma.subscription.create.mockResolvedValue(created);

      const result = await repo.create({
        userId: 'user-1',
        provider: 'revenuecat',
        revenueCatOriginalTransactionId: 'rc_txn_1',
        status: 'active',
      });

      expect(result).toEqual(created);
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          stripeCustomerId: undefined,
          provider: 'revenuecat',
          revenueCatOriginalTransactionId: 'rc_txn_1',
          status: 'active',
        },
      });
    });
  });

  describe('update', () => {
    it('should update a subscription by id', async () => {
      const updated = mockSubscription({ status: 'past_due' });
      prisma.subscription.update.mockResolvedValue(updated);

      const result = await repo.update('sub-1', { status: 'past_due' });

      expect(result).toEqual(updated);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'past_due' },
      });
    });
  });

  describe('grantCreditsIdempotent', () => {
    it('should return true when the grant row is newly created', async () => {
      prisma.creditGrant.create.mockResolvedValue({} as never);

      const result = await repo.grantCreditsIdempotent({
        subscriptionId: 'sub-1',
        userId: 'user-1',
        stripeInvoiceId: 'in_1',
        credits: 20,
      });

      expect(result).toBe(true);
      expect(prisma.creditGrant.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: 'sub-1',
          userId: 'user-1',
          stripeInvoiceId: 'in_1',
          credits: 20,
        },
      });
    });

    it('should return false on unique constraint violation (already granted)', async () => {
      prisma.creditGrant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'test',
        })
      );

      const result = await repo.grantCreditsIdempotent({
        subscriptionId: 'sub-1',
        userId: 'user-1',
        stripeInvoiceId: 'in_1',
        credits: 20,
      });

      expect(result).toBe(false);
    });

    it('should rethrow non-P2002 prisma errors', async () => {
      prisma.creditGrant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('other', {
          code: 'P2025',
          clientVersion: 'test',
        })
      );

      await expect(
        repo.grantCreditsIdempotent({
          subscriptionId: 'sub-1',
          userId: 'user-1',
          stripeInvoiceId: 'in_1',
          credits: 20,
        })
      ).rejects.toThrow();
    });
  });

  describe('grantCreditsIdempotentRevenueCat', () => {
    it('should return true when the grant row is newly created', async () => {
      prisma.creditGrant.create.mockResolvedValue({} as never);

      const result = await repo.grantCreditsIdempotentRevenueCat({
        subscriptionId: 'sub-1',
        userId: 'user-1',
        revenueCatEventId: 'evt_1',
        credits: 20,
      });

      expect(result).toBe(true);
      expect(prisma.creditGrant.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: 'sub-1',
          userId: 'user-1',
          revenueCatEventId: 'evt_1',
          credits: 20,
        },
      });
    });

    it('should return false on unique constraint violation (already granted)', async () => {
      prisma.creditGrant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'test',
        })
      );

      const result = await repo.grantCreditsIdempotentRevenueCat({
        subscriptionId: 'sub-1',
        userId: 'user-1',
        revenueCatEventId: 'evt_1',
        credits: 20,
      });

      expect(result).toBe(false);
    });

    it('should rethrow non-P2002 prisma errors', async () => {
      prisma.creditGrant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('other', {
          code: 'P2025',
          clientVersion: 'test',
        })
      );

      await expect(
        repo.grantCreditsIdempotentRevenueCat({
          subscriptionId: 'sub-1',
          userId: 'user-1',
          revenueCatEventId: 'evt_1',
          credits: 20,
        })
      ).rejects.toThrow();
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', async () => {
      prisma.subscription.update.mockResolvedValue(mockSubscription());
      await repo.softDelete('sub-1');
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
