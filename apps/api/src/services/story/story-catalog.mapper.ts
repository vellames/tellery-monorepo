import type {
  StoryCatalogDetailItem,
  StoryCatalogItem,
} from '../../repositories/StoryDefinitionRepository';

export interface StoryCatalogItemDto {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  teaser: string;
  genre: string;
  estimatedDurationMinutes: number;
  isFree: boolean;
  coverImageUrl: string | null;
  thumbnailUrl: string | null;
}

export interface StoryDetailDto extends StoryCatalogItemDto {
  opening: string;
  objective: string;
}

export const toStoryCatalogItemDto = (
  story: StoryCatalogItem
): StoryCatalogItemDto => ({
  id: story.id,
  slug: story.slug,
  title: story.title,
  subtitle: story.subtitle,
  teaser: story.teaser,
  genre: story.genre,
  estimatedDurationMinutes: story.estimatedDurationMinutes,
  isFree: story.isFree,
  coverImageUrl: story.coverImageUrl,
  thumbnailUrl: story.thumbnailUrl,
});

export const toStoryDetailDto = (
  story: StoryCatalogDetailItem
): StoryDetailDto => ({
  ...toStoryCatalogItemDto(story),
  opening: story.opening,
  objective: story.objective,
});
