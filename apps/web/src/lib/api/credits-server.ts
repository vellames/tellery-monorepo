import 'server-only';
import { apiFetch } from '@/lib/api/client';

export async function fetchAvailableCredits(): Promise<number> {
  const data = await apiFetch<{ availableCredits: number }>(
    '/me/available-credits'
  );
  return data.availableCredits;
}
