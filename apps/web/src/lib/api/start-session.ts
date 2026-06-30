import { config } from '@/lib/config';

export async function startSessionRequest(
  historyId: string
): Promise<{ sessionId: string }> {
  const res = await fetch(config.routes.sessionStartApi, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ historyId }),
  });

  const body = (await res.json().catch(() => null)) as {
    sessionId?: string;
    error?: string;
  } | null;

  if (!res.ok || !body?.sessionId) {
    throw new Error(body?.error ?? '');
  }

  return { sessionId: body.sessionId };
}
