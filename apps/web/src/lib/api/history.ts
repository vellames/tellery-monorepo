import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type { History, PaginatedResponse } from '@/lib/types/history';

export async function fetchFeaturedHistories(): Promise<History[]> {
  const data = await apiFetch<PaginatedResponse<History>>(
    '/histories?isFeatured=true'
  );
  return data.items;
}
