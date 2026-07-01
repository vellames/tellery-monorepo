import { clientFetch } from '@/lib/api/client-fetch';
import { config } from '@/lib/config';
import type { LoginPayload, RegisterPayload, User } from '@/lib/types/auth';

interface LoginResponse {
  user: User;
}

interface RegisterResponse {
  user: User;
}

export async function loginRequest(payload: LoginPayload): Promise<User> {
  const body = await clientFetch<LoginResponse>(config.routes.loginApi, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return body.user;
}

export async function registerRequest(payload: RegisterPayload): Promise<User> {
  const body = await clientFetch<RegisterResponse>(config.routes.registerApi, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return body.user;
}

export async function verifyEmailRequest(token: string): Promise<User> {
  const body = await clientFetch<RegisterResponse>(
    config.routes.verifyEmailApi,
    {
      method: 'POST',
      body: JSON.stringify({ token }),
    }
  );
  return body.user;
}

export async function resendVerificationRequest(): Promise<void> {
  await clientFetch(config.routes.resendVerificationApi, { method: 'POST' });
}

export async function logoutRequest(): Promise<void> {
  await clientFetch(config.routes.logoutApi, { method: 'POST' });
}
