import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(
    async () => (key: string) =>
      key === 'startError' ? 'Could not start' : key
  ),
}));
vi.mock('@/lib/api/session', () => ({
  startSession: vi.fn(),
}));
vi.mock('@/lib/api/me', () => ({
  refreshSessionUser: vi.fn(),
}));

import { redirect } from 'next/navigation';
import { startSession } from '@/lib/api/session';
import { refreshSessionUser } from '@/lib/api/me';
import { ApiError } from '@/lib/api/client';
import { startSessionAction } from '@/lib/actions/session';

const INITIAL = { error: null };

describe('startSessionAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a localized error instead of throwing when startSession fails', async () => {
    vi.mocked(startSession).mockRejectedValue(
      new ApiError('You have no sessions available', 402)
    );

    const result = await startSessionAction(
      'history-1',
      INITIAL,
      new FormData()
    );

    expect(result.error).toBe('You have no sessions available');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('falls back to the generic error for unexpected failures', async () => {
    vi.mocked(startSession).mockRejectedValue(new Error('boom'));

    const result = await startSessionAction(
      'history-1',
      INITIAL,
      new FormData()
    );

    expect(result.error).toBe('Could not start');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects to the session on success', async () => {
    vi.mocked(startSession).mockResolvedValue({ sessionId: 'session-1' });
    vi.mocked(refreshSessionUser).mockResolvedValue({
      id: '1',
      name: 'A',
      email: 'a@b.c',
      availableSessions: 2,
      createdAt: '',
      updatedAt: '',
    });

    await startSessionAction('history-1', INITIAL, new FormData());

    expect(refreshSessionUser).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/sessions/session-1');
  });
});
