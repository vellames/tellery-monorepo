import { config } from '@/lib/config';
import type { LoginPayload, User } from '@/lib/types/auth';

export async function loginRequest(payload: LoginPayload): Promise<User> {
  const res = await fetch(config.routes.loginApi, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => null)) as { user?: User; error?: string } | null;

  if (!res.ok || !body?.user) {
    throw new Error(body?.error ?? 'Falha ao entrar');
  }

  return body.user;
}

export async function logoutRequest(): Promise<void> {
  await fetch(config.routes.logoutApi, { method: 'POST' });
}
