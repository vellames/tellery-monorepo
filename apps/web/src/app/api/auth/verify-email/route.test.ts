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
vi.mock('@/lib/auth/session', () => ({
  updateSessionUser: vi.fn(),
}));

import { POST } from '@/app/api/auth/verify-email/route';
import { apiFetch, ApiError } from '@/lib/api/client';
import { updateSessionUser } from '@/lib/auth/session';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const user = {
  id: '1',
  name: 'Ana',
  email: 'a@b.c',
  ssn: null,
  emailVerifiedAt: '2026-07-01T00:00:00.000Z',
  createdAt: '',
  updatedAt: '',
};

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 422 when token is missing', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(422);
    expect(updateSessionUser).not.toHaveBeenCalled();
  });

  it('refreshes the session and returns the user on success', async () => {
    vi.mocked(apiFetch).mockResolvedValue(user);

    const res = await POST(makeReq({ token: 'valid-token' }));

    expect(apiFetch).toHaveBeenCalledWith(
      '/users/verify-email',
      expect.objectContaining({ method: 'POST' })
    );
    expect(updateSessionUser).toHaveBeenCalledWith(user);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user });
  });

  it('forwards the ApiError status', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError('Invalid or expired verification link', 422)
    );

    const res = await POST(makeReq({ token: 'bad' }));

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe(
      'Invalid or expired verification link'
    );
    expect(updateSessionUser).not.toHaveBeenCalled();
  });
});
