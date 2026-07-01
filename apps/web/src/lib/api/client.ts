import 'server-only';
import { cookies } from 'next/headers';
import { StatusCodes } from 'http-status-codes';
import { config } from '@/lib/config';
import { LOCALE_COOKIE, defaultLocale } from '@/i18n/config';
import { ApiError, REQUEST_FAILED } from '@/lib/api/error';

export { ApiError } from '@/lib/api/error';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const store = await cookies();
  const locale = store.get(LOCALE_COOKIE)?.value ?? defaultLocale;
  const token = store.get(config.auth.sessionCookie)?.value;

  const res = await fetch(`${config.api.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body?.success || body.data === undefined) {
    throw new ApiError(
      body?.error ?? REQUEST_FAILED,
      res.ok ? StatusCodes.INTERNAL_SERVER_ERROR : res.status,
      body ? (body as unknown as Record<string, unknown>) : undefined
    );
  }

  return body.data;
}
