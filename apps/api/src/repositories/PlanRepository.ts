import { PrismaClient, Plan } from '@prisma/client';
import { IPlanRepository } from '../interfaces';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';

export class PlanRepository extends BaseRepository implements IPlanRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByStripePriceId(
    stripePriceId: string,
    tx?: PrismaTransaction
  ): Promise<Plan | null> {
    const client = tx || this.prisma;
    return client.plan.findFirst({
      where: { stripePriceId, deletedAt: null },
    });
  }

  async findActive(tx?: PrismaTransaction): Promise<Plan | null> {
    const client = tx || this.prisma;
    return client.plan.findFirst({
      where: { active: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }
}
