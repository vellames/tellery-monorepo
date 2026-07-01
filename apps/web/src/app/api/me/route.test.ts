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

import { PATCH } from '@/app/api/me/route';
import { apiFetch, ApiError } from '@/lib/api/client';
import { updateSessionUser } from '@/lib/auth/session';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const user = {
  id: '1',
  name: 'Ana Updated',
  email: 'ana.updated@b.c',
  ssn: '29537995593',
  createdAt: '',
  updatedAt: '',
};

describe('PATCH /api/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 422 when required fields are missing', async () => {
    const res = await PATCH(makeReq({ name: 'Ana' }));

    expect(res.status).toBe(422);
    expect(updateSessionUser).not.toHaveBeenCalled();
  });

  it('updates the session user and returns the user on success', async () => {
    vi.mocked(apiFetch).mockResolvedValue(user);

    const res = await PATCH(
      makeReq({
        name: 'Ana Updated',
        email: 'ana.updated@b.c',
        ssn: '295.379.955-93',
      })
    );

    expect(apiFetch).toHaveBeenCalledWith('/me', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Ana Updated',
        email: 'ana.updated@b.c',
        ssn: '295.379.955-93',
      }),
    });
    expect(res.status).toBe(200);
    expect(updateSessionUser).toHaveBeenCalledWith(user);
    expect((await res.json()).user).toEqual(user);
  });

  it('forwards the ApiError message and status', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError('Email already in use', 409)
    );

    const res = await PATCH(
      makeReq({ name: 'Ana', email: 'taken@b.c', ssn: null })
    );

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('Email already in use');
    expect(updateSessionUser).not.toHaveBeenCalled();
  });
});
