import { IHistoryDefinitionRepository } from '../../interfaces';
import {
  toHistoryCatalogItemDto,
  HistoryCatalogItemDto,
} from './history-catalog.mapper';

export class HistoryCatalogService {
  constructor(
    private readonly histories: IHistoryDefinitionRepository
  ) {}

  async listAvailable(): Promise<HistoryCatalogItemDto[]> {
    const histories = await this.histories.listPublished();
    return histories.map(toHistoryCatalogItemDto);
  }
}
