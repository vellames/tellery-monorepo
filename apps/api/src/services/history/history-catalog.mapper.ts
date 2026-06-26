import type { HistoryCatalogItem } from '../../repositories/HistoryDefinitionRepository';

export interface HistoryCatalogItemDto {
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

export const toHistoryCatalogItemDto = (
  history: HistoryCatalogItem
): HistoryCatalogItemDto => ({
  id: history.id,
  slug: history.slug,
  title: history.title,
  subtitle: history.subtitle,
  teaser: history.teaser,
  genre: history.genre,
  estimatedDurationMinutes: history.estimatedDurationMinutes,
  isFree: history.isFree,
  coverImageUrl: history.coverImageUrl,
  thumbnailUrl: history.thumbnailUrl,
});
