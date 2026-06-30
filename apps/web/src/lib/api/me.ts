import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type { User } from '@/lib/types/auth';

export async function fetchMe(): Promise<User> {
  return apiFetch<User>('/me');
}
