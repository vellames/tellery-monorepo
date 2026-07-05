import type {
  StoryCatalogDetailItem,
  StoryCatalogItem,
  StoryWithDefinitions,
} from '../../repositories/StoryDefinitionRepository';
import type {
  PaginatedResult,
  PaginationQuery,
} from '../../types/pagination.types';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface IStoryDefinitionRepository extends IBaseRepository {
  findById(
    storyId: string,
    tx?: PrismaTransaction
  ): Promise<StoryWithDefinitions | null>;
  findBySlug(
    slug: string,
    tx?: PrismaTransaction
  ): Promise<StoryWithDefinitions | null>;
  list(tx?: PrismaTransaction): Promise<StoryWithDefinitions[]>;
  findPublishedById(storyId: string): Promise<StoryCatalogItem | null>;
  findPublishedDetailById(
    storyId: string
  ): Promise<StoryCatalogDetailItem | null>;
  findPublishedDetailBySlug(
    slug: string
  ): Promise<StoryCatalogDetailItem | null>;
  listPublished(
    isFeatured: boolean,
    pagination: PaginationQuery,
    isFree?: boolean
  ): Promise<PaginatedResult<StoryCatalogItem>>;
}
