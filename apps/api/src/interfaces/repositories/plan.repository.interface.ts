import { Plan } from '@prisma/client';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface IPlanRepository extends IBaseRepository {
  findByStripePriceId(
    stripePriceId: string,
    tx?: PrismaTransaction
  ): Promise<Plan | null>;
  findByRevenueCatProductId(
    revenueCatProductId: string,
    tx?: PrismaTransaction
  ): Promise<Plan | null>;
  findActive(tx?: PrismaTransaction): Promise<Plan | null>;
}
