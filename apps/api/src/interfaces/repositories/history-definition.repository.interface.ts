import type {
  HistoryCatalogDetailItem,
  HistoryCatalogItem,
  HistoryWithDefinitions,
} from '../../repositories/HistoryDefinitionRepository';
import type {
  PaginatedResult,
  PaginationQuery,
} from '../../types/pagination.types';
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
  findPublishedById(historyId: string): Promise<HistoryCatalogItem | null>;
  findPublishedDetailById(
    historyId: string
  ): Promise<HistoryCatalogDetailItem | null>;
  listPublished(
    isFeatured: boolean,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<HistoryCatalogItem>>;
}
