import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type {
  CompletedHistoryMap,
  PaginatedSessions,
  SessionState,
  StartSessionResponse,
} from '@/lib/types/session';

export async function startSession(
  historyId: string
): Promise<StartSessionResponse> {
  const data = await apiFetch<{ session: { id: string } }>('/session/start', {
    method: 'POST',
    body: JSON.stringify({ historyId }),
  });
  return { sessionId: data.session.id };
}

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

export async function fetchCompletedHistoryMap(): Promise<CompletedHistoryMap> {
  const map: CompletedHistoryMap = {};
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await apiFetch<PaginatedSessions>(
      `/session?page=${page}&limit=50&status=completed`
    );
    totalPages = data.totalPages;
    for (const item of data.items) {
      if (item.endingType) {
        map[item.historyId] = item.endingType;
      }
    }
    page++;
  }

  return map;
}
