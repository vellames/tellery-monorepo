import { describe, expect, it, vi } from 'vitest';
import { clientFetch } from '@/lib/api/client-fetch';
import { ApiError } from '@/lib/api/error';

describe('clientFetch', () => {
  it('returns the parsed body on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user: { id: '1' } }), { status: 200 })
    );

    const body = await clientFetch<{ user: { id: string } }>('/api/x');

    expect(body).toEqual({ user: { id: '1' } });
  });

  it('sends Content-Type application/json by default', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

    await clientFetch('/api/x', { method: 'POST', body: '{}' });

    const init = fetchMock.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json'
    );
  });

  it('throws ApiError preserving status and server message on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
      })
    );

    await expect(clientFetch('/api/x')).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
    await expect(clientFetch('/api/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic message when the body has no error field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('null', { status: 500 })
    );

    await expect(clientFetch('/api/x')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed',
    });
  });

  it('throws ApiError with status 0 on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    await expect(clientFetch('/api/x')).rejects.toMatchObject({
      status: 0,
      message: 'Failed to fetch',
    });
    await expect(clientFetch('/api/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('allows caller headers to override the default Content-Type', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    await clientFetch('/api/x', {
      headers: { 'Content-Type': 'text/plain' },
    });

    const init = fetchMock.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'text/plain'
    );
  });
});
