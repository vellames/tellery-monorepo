import { IHistoryDefinitionRepository } from '../../interfaces';
import {
  toHistoryCatalogItemDto,
  HistoryCatalogItemDto,
} from './history-catalog.mapper';

export class HistoryCatalogService {
  constructor(
    private readonly histories: IHistoryDefinitionRepository
  ) {}

  async listAvailable(isFeatured: boolean): Promise<HistoryCatalogItemDto[]> {
    const histories = await this.histories.listPublished(isFeatured);
    return histories.map(toHistoryCatalogItemDto);
  }
}
