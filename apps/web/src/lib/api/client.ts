import 'server-only';
import { StatusCodes } from 'http-status-codes';
import { config } from '@/lib/config';

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
  const res = await fetch(`${config.api.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': config.i18n.defaultLocale,
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
