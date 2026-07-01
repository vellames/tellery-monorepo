import { clientFetch } from '@/lib/api/client-fetch';
import { config } from '@/lib/config';
import type { LoginPayload, RegisterPayload, User } from '@/lib/types/auth';

interface LoginResponse {
  user: User;
}

export async function loginRequest(payload: LoginPayload): Promise<User> {
  const body = await clientFetch<LoginResponse>(config.routes.loginApi, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return body.user;
}

export async function registerRequest(payload: RegisterPayload): Promise<void> {
  await clientFetch(config.routes.registerApi, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logoutRequest(): Promise<void> {
  await clientFetch(config.routes.logoutApi, { method: 'POST' });
}
