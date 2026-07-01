import { Subscription } from '@prisma/client';
import {
  CreateSubscriptionData,
  UpdateSubscriptionData,
} from '../../types/domain/subscription/subscription.dto';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface ISubscriptionRepository extends IBaseRepository {
  findByUserId(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Subscription | null>;
  findByStripeCustomerId(
    customerId: string,
    tx?: PrismaTransaction
  ): Promise<Subscription | null>;
  findByStripeSubscriptionId(
    subscriptionId: string,
    tx?: PrismaTransaction
  ): Promise<Subscription | null>;
  create(
    data: CreateSubscriptionData,
    tx?: PrismaTransaction
  ): Promise<Subscription>;
  update(
    id: string,
    data: UpdateSubscriptionData,
    tx?: PrismaTransaction
  ): Promise<Subscription>;
  grantCreditsIdempotent(
    data: {
      subscriptionId: string;
      userId: string;
      stripeInvoiceId: string;
      credits: number;
    },
    tx?: PrismaTransaction
  ): Promise<boolean>;
  softDelete(id: string, tx?: PrismaTransaction): Promise<void>;
}
