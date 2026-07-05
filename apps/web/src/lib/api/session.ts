import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type {
  CompletedStoryMap,
  PaginatedSessions,
  SessionState,
} from '@/lib/types/session';

export async function fetchSession(sessionId: string): Promise<SessionState> {
  return apiFetch<SessionState>(`/session/${sessionId}`);
}

export async function fetchSessions(
  page = 1,
  limit = 10,
  status?: string
): Promise<PaginatedSessions> {
  const qs = `page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
  return apiFetch<PaginatedSessions>(`/session?${qs}`);
}

export async function fetchCompletedStoryMap(): Promise<CompletedStoryMap> {
  const map: CompletedStoryMap = {};
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await apiFetch<PaginatedSessions>(
      `/session?page=${page}&limit=50&status=completed`
    );
    totalPages = data.totalPages;
    for (const item of data.items) {
      if (item.endingType) {
        map[item.storyId] = item.endingType;
      }
    }
    page++;
  }

  return map;
}
