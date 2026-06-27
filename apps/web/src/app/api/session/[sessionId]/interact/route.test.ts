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

import { POST } from '@/app/api/session/[sessionId]/interact/route';
import { apiFetch, ApiError } from '@/lib/api/client';
import type { InteractResult } from '@/lib/types/session';

function makeReq(body: unknown, sessionId = 's1') {
  return new NextRequest(`http://localhost/api/session/${sessionId}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = (sessionId: string) => Promise.resolve({ sessionId });

describe('POST /api/session/:sessionId/interact', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 422 when stateId or interaction is missing', async () => {
    const res = await POST(makeReq({ stateId: 'x' }), {
      params: params('s1'),
    });
    expect(res.status).toBe(422);
  });

  it('forwards to the api and returns the interact result', async () => {
    const result: InteractResult = {
      id: 'char-1',
      stateType: 'character',
      reply: 'I saw nothing.',
      discoveredClues: [],
    };
    vi.mocked(apiFetch).mockResolvedValue(result);

    const res = await POST(
      makeReq({ stateId: 'char-1', interaction: 'What did you see?' }),
      { params: params('s1') }
    );

    expect(apiFetch).toHaveBeenCalledWith('/session/s1/interact', {
      method: 'POST',
      body: JSON.stringify({
        stateId: 'char-1',
        interaction: 'What did you see?',
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(result);
  });

  it('forwards the ApiError message and status', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new ApiError('nope', 404));

    const res = await POST(makeReq({ stateId: 'x', interaction: 'hi' }), {
      params: params('s1'),
    });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('nope');
  });
});
