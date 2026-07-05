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

import { POST } from '@/app/api/auth/convert/route';
import { apiFetch, ApiError } from '@/lib/api/client';
import { setSession } from '@/lib/auth/session';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const authPayload = {
  token: 'new-signed-token',
  user: {
    id: '1',
    name: 'Ana Convertida',
    email: 'ana@teste.local',
    accountType: 'permanent' as const,
    ssn: null,
    emailVerifiedAt: null,
    createdAt: '',
    updatedAt: '',
  },
};

describe('POST /api/auth/convert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 422 when required fields are missing', async () => {
    const res = await POST(makeReq({ name: 'Ana' }));
    expect(res.status).toBe(422);
  });

  it('saves the session and returns 200 with the user on success', async () => {
    vi.mocked(apiFetch).mockResolvedValue(authPayload);

    const res = await POST(
      makeReq({
        name: 'Ana Convertida',
        email: 'ana@teste.local',
        password: 'password123',
      })
    );

    expect(apiFetch).toHaveBeenCalledWith('/users/convert', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ana Convertida',
        email: 'ana@teste.local',
        password: 'password123',
      }),
    });
    expect(setSession).toHaveBeenCalledWith(
      authPayload.token,
      authPayload.user
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: authPayload.user });
  });

  it('forwards the ApiError message and status', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError('Email already in use', 409)
    );

    const res = await POST(
      makeReq({
        name: 'Ana',
        email: 'ana@teste.local',
        password: 'password123',
      })
    );

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('Email already in use');
    expect(setSession).not.toHaveBeenCalled();
  });
});
