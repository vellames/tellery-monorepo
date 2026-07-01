import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));
vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number
    ) {
      super(message);
    }
  },
}));

import { POST } from '@/app/api/session/start/route';
import { apiFetch, ApiError } from '@/lib/api/client';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/session/start', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts a session and returns the sessionId', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ session: { id: 'session-1' } });

    const res = await POST(makeReq({ historyId: 'history-1' }));

    expect(apiFetch).toHaveBeenCalledWith('/session/start', {
      method: 'POST',
      body: JSON.stringify({ historyId: 'history-1' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).sessionId).toBe('session-1');
  });

  it('forwards the ApiError status and message', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError('You have no credits available', 402)
    );

    const res = await POST(makeReq({ historyId: 'history-1' }));

    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('You have no credits available');
  });
});
