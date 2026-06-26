import 'server-only';
import { cookies } from 'next/headers';
import { StatusCodes } from 'http-status-codes';
import { config } from '@/lib/config';
import { LOCALE_COOKIE, defaultLocale } from '@/i18n/config';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const locale = (await cookies()).get(LOCALE_COOKIE)?.value ?? defaultLocale;

  const res = await fetch(`${config.api.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale,
      ...init.headers,
    },
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body?.success || body.data === undefined) {
    throw new ApiError(
      body?.error ?? 'Falha na requisição',
      res.ok ? StatusCodes.INTERNAL_SERVER_ERROR : res.status
    );
  }

  return body.data;
}
