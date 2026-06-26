import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === 'NEXT_LOCALE' ? { value: 'pt-BR' } : undefined,
  })),
}));

import { apiFetch, ApiError } from '@/lib/api/client';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns data and sends Accept-Language on success', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: '1' } }), {
        status: 200,
      })
    );

    const data = await apiFetch<{ id: string }>('/users/1');

    expect(data).toEqual({ id: '1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3232/users/1');
    const headers = init!.headers as Record<string, string>;
    expect(headers['Accept-Language']).toBe('pt-BR');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('throws ApiError with the server message on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: 'invalid' }), {
        status: 401,
      })
    );

    await expect(apiFetch('/x')).rejects.toMatchObject({
      message: 'invalid',
      status: 401,
    });
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic message when no error field is present', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('null', { status: 500 })
    );

    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 500 });
  });
});
