import { IHistoryDefinitionRepository, IImageUrlSigner } from '../../interfaces';
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
    private readonly histories: IHistoryDefinitionRepository,
    private readonly imageUrlSigner: IImageUrlSigner
  ) {}

  async listAvailable(
    isFeatured: boolean,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<HistoryCatalogItemDto>> {
    const result = await this.histories.listPublished(isFeatured, pagination);
    const items = await Promise.all(
      result.items.map(async (history) => {
        const dto = toHistoryCatalogItemDto(history);
        const [coverImageUrl, thumbnailUrl] = await Promise.all([
          this.imageUrlSigner.sign(dto.coverImageUrl),
          this.imageUrlSigner.sign(dto.thumbnailUrl),
        ]);
        return { ...dto, coverImageUrl, thumbnailUrl };
      })
    );
    return { ...result, items };
  }
}
