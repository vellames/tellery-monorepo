import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type { Story, StoryDetail, PaginatedResponse } from '@/lib/types/story';

const UPCOMING_LIMIT = 3;

async function fetchByFeaturedFlag(
  isFeatured: boolean,
  options?: { limit?: number; isFree?: boolean }
): Promise<Story[]> {
  const params = new URLSearchParams({ isFeatured: String(isFeatured) });
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.isFree !== undefined)
    params.set('isFree', String(options.isFree));
  const data = await apiFetch<PaginatedResponse<Story>>(
    `/stories?${params.toString()}`
  );
  return data.items;
}

export function fetchFeaturedStories(isFree?: boolean): Promise<Story[]> {
  return fetchByFeaturedFlag(true, { isFree });
}

export function fetchUpcomingStories(): Promise<Story[]> {
  return fetchByFeaturedFlag(false, { limit: UPCOMING_LIMIT });
}

export function fetchNonFeaturedStories(isFree?: boolean): Promise<Story[]> {
  return fetchByFeaturedFlag(false, { isFree });
}

export async function fetchStory(storyId: string): Promise<StoryDetail> {
  return apiFetch<StoryDetail>(`/stories/${storyId}`);
}

/**
 * Resolves a story by its slug via the dedicated `/stories/slug/:slug`
 * endpoint. Used by the ad landing page (/ad-stories/[slug]).
 */
export async function fetchStoryBySlug(slug: string): Promise<StoryDetail> {
  return apiFetch<StoryDetail>(`/stories/slug/${slug}`);
}
