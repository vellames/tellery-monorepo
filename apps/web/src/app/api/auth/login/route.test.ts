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
  setSession: vi.fn(),
}));

import { POST } from '@/app/api/auth/login/route';
import { apiFetch, ApiError } from '@/lib/api/client';
import { setSession } from '@/lib/auth/session';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 422 when required fields are missing', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(422);
  });

  it('sets the session and returns the user on success', async () => {
    const user = {
      id: '1',
      name: 'A',
      email: 'a@b.c',
      createdAt: '',
      updatedAt: '',
    };
    vi.mocked(apiFetch).mockResolvedValue({ token: 't', user });

    const res = await POST(makeReq({ email: 'a@b.c', password: '123' }));

    expect(res.status).toBe(200);
    expect(setSession).toHaveBeenCalledWith('t', user);
    expect((await res.json()).user).toEqual(user);
  });

  it('forwards the ApiError message and status', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new ApiError('creds', 401));

    const res = await POST(makeReq({ email: 'a@b.c', password: 'x' }));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('creds');
  });
});
