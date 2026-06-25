import type { HistoryWithDefinitions } from '../../repositories/HistoryDefinitionRepository';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface IHistoryDefinitionRepository extends IBaseRepository {
  findById(
    historyId: string,
    tx?: PrismaTransaction
  ): Promise<HistoryWithDefinitions | null>;
  findBySlug(
    slug: string,
    tx?: PrismaTransaction
  ): Promise<HistoryWithDefinitions | null>;
  list(tx?: PrismaTransaction): Promise<HistoryWithDefinitions[]>;
}
