import { HistorySession } from '@prisma/client';
import type { HistorySessionWithRelations } from '../../repositories/SessionRepository';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface ISessionRepository extends IBaseRepository {
  findById(
    sessionId: string,
    tx?: PrismaTransaction
  ): Promise<HistorySessionWithRelations | null>;
  list(userId?: string, tx?: PrismaTransaction): Promise<HistorySession[]>;
}
