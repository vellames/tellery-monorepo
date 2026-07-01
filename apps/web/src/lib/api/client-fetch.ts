import {
  ApiError,
  NETWORK_FAILURE_STATUS,
  REQUEST_FAILED,
} from '@/lib/api/error';

interface Envelope {
  error?: string;
}

export async function clientFetch<T>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const { headers, ...rest } = init;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string> | undefined),
      },
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : REQUEST_FAILED,
      NETWORK_FAILURE_STATUS
    );
  }

  const body = (await res.json().catch(() => null)) as (T & Envelope) | null;

  if (!res.ok) {
    throw new ApiError(
      body?.error || REQUEST_FAILED,
      res.status,
      (body as Record<string, unknown> | undefined) ?? undefined
    );
  }

  return body as T;
}
