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

import { POST } from '@/app/api/auth/temporary/route';
import { apiFetch, ApiError } from '@/lib/api/client';
import { setSession } from '@/lib/auth/session';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/temporary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const authPayload = {
  token: 'signed-token',
  user: {
    id: '1',
    name: 'Jogador',
    email: null,
    accountType: 'temporary' as const,
    ssn: null,
    emailVerifiedAt: null,
    createdAt: '',
    updatedAt: '',
  },
};

describe('POST /api/auth/temporary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves the session and returns 201 with the user on success', async () => {
    vi.mocked(apiFetch).mockResolvedValue(authPayload);

    const res = await POST(makeReq({}));

    expect(apiFetch).toHaveBeenCalledWith('/users/temporary', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect(setSession).toHaveBeenCalledWith(
      authPayload.token,
      authPayload.user
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ user: authPayload.user });
  });

  it('forwards the leadId when provided', async () => {
    vi.mocked(apiFetch).mockResolvedValue(authPayload);

    await POST(makeReq({ leadId: 'lead-uuid' }));

    expect(apiFetch).toHaveBeenCalledWith('/users/temporary', {
      method: 'POST',
      body: JSON.stringify({ leadId: 'lead-uuid' }),
    });
  });

  it('forwards the ApiError message and status', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError('Something went wrong', 500)
    );

    const res = await POST(makeReq({}));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Something went wrong');
    expect(setSession).not.toHaveBeenCalled();
  });
});
