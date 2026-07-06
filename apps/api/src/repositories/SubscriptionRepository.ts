import { PrismaClient, Subscription, Prisma } from '@prisma/client';
import { ISubscriptionRepository } from '../interfaces';
import {
  CreateSubscriptionData,
  UpdateSubscriptionData,
} from '../types/domain/subscription/subscription.dto';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';

export class SubscriptionRepository
  extends BaseRepository
  implements ISubscriptionRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByUserId(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Subscription | null> {
    const client = tx || this.prisma;
    return client.subscription.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  async findByStripeCustomerId(
    customerId: string,
    tx?: PrismaTransaction
  ): Promise<Subscription | null> {
    const client = tx || this.prisma;
    return client.subscription.findFirst({
      where: { stripeCustomerId: customerId, deletedAt: null },
    });
  }

  async findByStripeSubscriptionId(
    subscriptionId: string,
    tx?: PrismaTransaction
  ): Promise<Subscription | null> {
    const client = tx || this.prisma;
    return client.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId, deletedAt: null },
    });
  }

  async create(
    data: CreateSubscriptionData,
    tx?: PrismaTransaction
  ): Promise<Subscription> {
    const client = tx || this.prisma;
    return client.subscription.create({
      data: {
        userId: data.userId,
        stripeCustomerId: data.stripeCustomerId,
        provider: data.provider ?? 'stripe',
        revenueCatOriginalTransactionId: data.revenueCatOriginalTransactionId,
        status: data.status,
      },
    });
  }

  async update(
    id: string,
    data: UpdateSubscriptionData,
    tx?: PrismaTransaction
  ): Promise<Subscription> {
    const client = tx || this.prisma;
    return client.subscription.update({
      where: { id },
      data,
    });
  }

  async grantCreditsIdempotent(
    data: {
      subscriptionId: string;
      userId: string;
      stripeInvoiceId: string;
      credits: number;
    },
    tx?: PrismaTransaction
  ): Promise<boolean> {
    const client = tx || this.prisma;
    try {
      await client.creditGrant.create({
        data: {
          subscriptionId: data.subscriptionId,
          userId: data.userId,
          stripeInvoiceId: data.stripeInvoiceId,
          credits: data.credits,
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  async grantCreditsIdempotentRevenueCat(
    data: {
      subscriptionId: string;
      userId: string;
      revenueCatEventId: string;
      credits: number;
    },
    tx?: PrismaTransaction
  ): Promise<boolean> {
    const client = tx || this.prisma;
    try {
      await client.creditGrant.create({
        data: {
          subscriptionId: data.subscriptionId,
          userId: data.userId,
          revenueCatEventId: data.revenueCatEventId,
          credits: data.credits,
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  async softDelete(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = tx || this.prisma;
    await client.subscription.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
