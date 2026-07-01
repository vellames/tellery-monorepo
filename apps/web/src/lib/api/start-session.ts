import { clientFetch } from '@/lib/api/client-fetch';
import { config } from '@/lib/config';

interface StartSessionResponse {
  sessionId: string;
}

export async function startSessionRequest(
  historyId: string
): Promise<{ sessionId: string }> {
  return clientFetch<StartSessionResponse>(config.routes.sessionStartApi, {
    method: 'POST',
    body: JSON.stringify({ historyId }),
  });
}
