import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type { SessionState, StartSessionResponse } from '@/lib/types/session';

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
