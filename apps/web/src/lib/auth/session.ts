import 'server-only';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import type { User } from '@/lib/types/auth';

const cookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: config.auth.maxAgeSeconds,
};

export async function setSession(token: string, user: User): Promise<void> {
  const store = await cookies();
  store.set(config.auth.sessionCookie, token, {
    ...cookieOptions,
    httpOnly: true,
  });
  store.set(config.auth.userCookie, JSON.stringify(user), {
    ...cookieOptions,
    httpOnly: false,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(config.auth.sessionCookie);
  store.delete(config.auth.userCookie);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const raw = store.get(config.auth.userCookie)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function updateSessionUser(user: User): Promise<void> {
  const store = await cookies();
  store.set(config.auth.userCookie, JSON.stringify(user), {
    ...cookieOptions,
    httpOnly: false,
  });
}
