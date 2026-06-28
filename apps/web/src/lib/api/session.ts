import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type {
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
  limit = 10
): Promise<PaginatedSessions> {
  return apiFetch<PaginatedSessions>(`/session?page=${page}&limit=${limit}`);
}
