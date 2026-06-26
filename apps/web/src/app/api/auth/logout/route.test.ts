import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  clearSession: vi.fn(),
}));

import { POST } from '@/app/api/auth/logout/route';
import { clearSession } from '@/lib/auth/session';

describe('POST /api/auth/logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clears the session and returns success', async () => {
    const res = await POST();

    expect(clearSession).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
