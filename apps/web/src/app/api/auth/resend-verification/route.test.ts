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

import { POST } from '@/app/api/auth/resend-verification/route';
import { apiFetch, ApiError } from '@/lib/api/client';

function makeReq() {
  return new NextRequest('http://localhost/api/auth/resend-verification', {
    method: 'POST',
  });
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success when the backend resends the email', async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined);

    const res = await POST(makeReq());

    expect(apiFetch).toHaveBeenCalledWith('/users/resend-verification', {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('forwards 409 when the email is already verified', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError('Email is already verified', 409)
    );

    const res = await POST(makeReq());

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('Email is already verified');
  });
});
