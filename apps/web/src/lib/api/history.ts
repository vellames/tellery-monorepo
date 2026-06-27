import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type { History, PaginatedResponse } from '@/lib/types/history';

const UPCOMING_LIMIT = 3;

export async function fetchFeaturedHistories(): Promise<History[]> {
  const data = await apiFetch<PaginatedResponse<History>>(
    '/histories?isFeatured=true'
  );
  return data.items;
}

export async function fetchUpcomingHistories(): Promise<History[]> {
  const data = await apiFetch<PaginatedResponse<History>>(
    `/histories?isFeatured=false&limit=${UPCOMING_LIMIT}`
  );
  return data.items;
}
