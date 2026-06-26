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

import { POST } from '@/app/api/auth/register/route';
import { apiFetch, ApiError } from '@/lib/api/client';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 422 when required fields are missing', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(422);
  });

  it('returns 201 on success', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      id: '1',
      name: 'A',
      email: 'a@b.c',
      createdAt: '',
      updatedAt: '',
    });

    const res = await POST(
      makeReq({ name: 'Ana', email: 'a@b.c', password: '123456' })
    );

    expect(res.status).toBe(201);
    expect((await res.json()).success).toBe(true);
  });

  it('forwards the ApiError message and status', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError('Email already in use', 409)
    );

    const res = await POST(
      makeReq({ name: 'Ana', email: 'a@b.c', password: '123456' })
    );

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('Email already in use');
  });
});
