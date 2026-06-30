import 'server-only';
import { apiFetch } from '@/lib/api/client';
import { updateSessionUser } from '@/lib/auth/session';
import type { User } from '@/lib/types/auth';

export async function fetchMe(): Promise<User> {
  return apiFetch<User>('/me');
}

export async function refreshSessionUser(): Promise<User> {
  const user = await fetchMe();
  await updateSessionUser(user);
  return user;
}
