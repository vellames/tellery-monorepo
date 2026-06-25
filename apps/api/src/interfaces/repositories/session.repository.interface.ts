import { HistorySession } from '@prisma/client';
import type { HistoryWithDefinitions } from '../../repositories/HistoryDefinitionRepository';
import type { HistorySessionWithRelations } from '../../repositories/SessionRepository';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface ISessionRepository extends IBaseRepository {
  create(
    input: { userId: string; history: HistoryWithDefinitions },
    tx?: PrismaTransaction
  ): Promise<HistorySessionWithRelations>;
  findById(
    sessionId: string,
    tx?: PrismaTransaction
  ): Promise<HistorySessionWithRelations | null>;
  list(userId?: string, tx?: PrismaTransaction): Promise<HistorySession[]>;
}
