import { StatusCodes } from 'http-status-codes';
import { IStoryDefinitionRepository, IImageUrlSigner } from '../../interfaces';
import { HttpError } from '../../utils/http-error';
import { PaginatedResult, PaginationQuery } from '../../types/pagination.types';
import {
  toStoryCatalogItemDto,
  toStoryDetailDto,
  StoryCatalogItemDto,
  StoryDetailDto,
} from './story-catalog.mapper';
import type {
  StoryCatalogDetailItem,
  StoryCatalogItem,
} from '../../repositories/StoryDefinitionRepository';

export class StoryCatalogService {
  constructor(
    private readonly stories: IStoryDefinitionRepository,
    private readonly imageUrlSigner: IImageUrlSigner
  ) {}

  async listAvailable(
    isFeatured: boolean,
    pagination: PaginationQuery,
    isFree?: boolean
  ): Promise<PaginatedResult<StoryCatalogItemDto>> {
    const result = await this.stories.listPublished(
      isFeatured,
      pagination,
      isFree
    );
    const items = await Promise.all(
      result.items.map((story) => this.toSignedDto(story))
    );
    return { ...result, items };
  }

  async getById(storyId: string): Promise<StoryDetailDto> {
    const story = await this.stories.findPublishedDetailById(storyId);
    if (!story) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        storyId,
        'session:errors.unknownStory'
      );
    }
    return this.toSignedDetailDto(story);
  }

  async getBySlug(slug: string): Promise<StoryDetailDto> {
    const story = await this.stories.findPublishedDetailBySlug(slug);
    if (!story) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        slug,
        'session:errors.unknownStory'
      );
    }
    return this.toSignedDetailDto(story);
  }

  private async toSignedDto(
    story: StoryCatalogItem
  ): Promise<StoryCatalogItemDto> {
    const dto = toStoryCatalogItemDto(story);
    const [coverImageUrl, thumbnailUrl] = await Promise.all([
      this.imageUrlSigner.sign(dto.coverImageUrl),
      this.imageUrlSigner.sign(dto.thumbnailUrl),
    ]);
    return { ...dto, coverImageUrl, thumbnailUrl };
  }

  private async toSignedDetailDto(
    story: StoryCatalogDetailItem
  ): Promise<StoryDetailDto> {
    const dto = toStoryDetailDto(story);
    const [coverImageUrl, thumbnailUrl] = await Promise.all([
      this.imageUrlSigner.sign(dto.coverImageUrl),
      this.imageUrlSigner.sign(dto.thumbnailUrl),
    ]);
    return { ...dto, coverImageUrl, thumbnailUrl };
  }
}
