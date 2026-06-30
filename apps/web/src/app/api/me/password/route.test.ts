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

import { PATCH } from '@/app/api/me/password/route';
import { apiFetch, ApiError } from '@/lib/api/client';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/me/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/me/password', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 422 when required fields are missing', async () => {
    const res = await PATCH(makeReq({ currentPassword: '123' }));

    expect(res.status).toBe(422);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('calls the backend and returns success on a valid request', async () => {
    vi.mocked(apiFetch).mockResolvedValue(null);

    const res = await PATCH(
      makeReq({ currentPassword: 'old-pass', newPassword: 'new-password' })
    );

    expect(apiFetch).toHaveBeenCalledWith('/me/password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: 'old-pass',
        newPassword: 'new-password',
      }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('forwards the ApiError message and status', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError('Current password is incorrect', 401)
    );

    const res = await PATCH(
      makeReq({ currentPassword: 'wrong', newPassword: 'new-password' })
    );

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Current password is incorrect');
  });
});
