import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type { History, PaginatedResponse } from '@/lib/types/history';

const UPCOMING_LIMIT = 3;

async function fetchByFeaturedFlag(
  isFeatured: boolean,
  limit?: number
): Promise<History[]> {
  const params = new URLSearchParams({ isFeatured: String(isFeatured) });
  if (limit) params.set('limit', String(limit));
  const data = await apiFetch<PaginatedResponse<History>>(
    `/histories?${params.toString()}`
  );
  return data.items;
}

export function fetchFeaturedHistories(): Promise<History[]> {
  return fetchByFeaturedFlag(true);
}

export function fetchUpcomingHistories(): Promise<History[]> {
  return fetchByFeaturedFlag(false, UPCOMING_LIMIT);
}

export function fetchNonFeaturedHistories(): Promise<History[]> {
  return fetchByFeaturedFlag(false);
}
