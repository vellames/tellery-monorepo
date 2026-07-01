import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type {
  History,
  HistoryDetail,
  PaginatedResponse,
} from '@/lib/types/history';

const UPCOMING_LIMIT = 3;

async function fetchByFeaturedFlag(
  isFeatured: boolean,
  options?: { limit?: number; isFree?: boolean }
): Promise<History[]> {
  const params = new URLSearchParams({ isFeatured: String(isFeatured) });
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.isFree !== undefined)
    params.set('isFree', String(options.isFree));
  const data = await apiFetch<PaginatedResponse<History>>(
    `/histories?${params.toString()}`
  );
  return data.items;
}

export function fetchFeaturedHistories(isFree?: boolean): Promise<History[]> {
  return fetchByFeaturedFlag(true, { isFree });
}

export function fetchUpcomingHistories(): Promise<History[]> {
  return fetchByFeaturedFlag(false, { limit: UPCOMING_LIMIT });
}

export function fetchNonFeaturedHistories(
  isFree?: boolean
): Promise<History[]> {
  return fetchByFeaturedFlag(false, { isFree });
}

export async function fetchHistory(historyId: string): Promise<HistoryDetail> {
  return apiFetch<HistoryDetail>(`/histories/${historyId}`);
}
