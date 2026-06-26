import { IHistoryDefinitionRepository } from '../../interfaces';
import {
  PaginatedResult,
  PaginationQuery,
} from '../../types/pagination.types';
import {
  toHistoryCatalogItemDto,
  HistoryCatalogItemDto,
} from './history-catalog.mapper';

export class HistoryCatalogService {
  constructor(
    private readonly histories: IHistoryDefinitionRepository
  ) {}

  async listAvailable(
    isFeatured: boolean,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<HistoryCatalogItemDto>> {
    const result = await this.histories.listPublished(isFeatured, pagination);
    return {
      ...result,
      items: result.items.map(toHistoryCatalogItemDto),
    };
  }
}
