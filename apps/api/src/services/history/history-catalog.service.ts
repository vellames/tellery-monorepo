import { StatusCodes } from 'http-status-codes';
import {
  IHistoryDefinitionRepository,
  IImageUrlSigner,
} from '../../interfaces';
import { HttpError } from '../../utils/http-error';
import { PaginatedResult, PaginationQuery } from '../../types/pagination.types';
import {
  toHistoryCatalogItemDto,
  toHistoryDetailDto,
  HistoryCatalogItemDto,
  HistoryDetailDto,
} from './history-catalog.mapper';
import type {
  HistoryCatalogDetailItem,
  HistoryCatalogItem,
} from '../../repositories/HistoryDefinitionRepository';

export class HistoryCatalogService {
  constructor(
    private readonly histories: IHistoryDefinitionRepository,
    private readonly imageUrlSigner: IImageUrlSigner
  ) {}

  async listAvailable(
    isFeatured: boolean,
    pagination: PaginationQuery,
    isFree?: boolean
  ): Promise<PaginatedResult<HistoryCatalogItemDto>> {
    const result = await this.histories.listPublished(
      isFeatured,
      pagination,
      isFree
    );
    const items = await Promise.all(
      result.items.map((history) => this.toSignedDto(history))
    );
    return { ...result, items };
  }

  async getById(historyId: string): Promise<HistoryDetailDto> {
    const history = await this.histories.findPublishedDetailById(historyId);
    if (!history) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        historyId,
        'session:errors.unknownHistory'
      );
    }
    return this.toSignedDetailDto(history);
  }

  private async toSignedDto(
    history: HistoryCatalogItem
  ): Promise<HistoryCatalogItemDto> {
    const dto = toHistoryCatalogItemDto(history);
    const [coverImageUrl, thumbnailUrl] = await Promise.all([
      this.imageUrlSigner.sign(dto.coverImageUrl),
      this.imageUrlSigner.sign(dto.thumbnailUrl),
    ]);
    return { ...dto, coverImageUrl, thumbnailUrl };
  }

  private async toSignedDetailDto(
    history: HistoryCatalogDetailItem
  ): Promise<HistoryDetailDto> {
    const dto = toHistoryDetailDto(history);
    const [coverImageUrl, thumbnailUrl] = await Promise.all([
      this.imageUrlSigner.sign(dto.coverImageUrl),
      this.imageUrlSigner.sign(dto.thumbnailUrl),
    ]);
    return { ...dto, coverImageUrl, thumbnailUrl };
  }
}
