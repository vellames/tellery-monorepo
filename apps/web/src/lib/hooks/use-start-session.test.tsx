import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/api/start-session', () => ({
  startSessionRequest: vi.fn(),
}));

import { toast } from 'sonner';
import { startSessionRequest } from '@/lib/api/start-session';
import { useStartSession } from '@/lib/hooks/use-start-session';
import { renderHookWithProviders } from '@/test-utils';

describe('useStartSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('navigates to the session on success', async () => {
    vi.mocked(startSessionRequest).mockResolvedValue({
      sessionId: 'session-1',
    });
    const { result } = renderHookWithProviders(() => useStartSession());

    await act(async () => {
      await result.current.mutateAsync('story-1');
    });

    expect(pushMock).toHaveBeenCalledWith('/sessions/session-1');
  });

  it('toasts the error on failure', async () => {
    vi.mocked(startSessionRequest).mockRejectedValue(
      new Error('You have no credits available')
    );
    const { result } = renderHookWithProviders(() => useStartSession());

    await act(async () => {
      await expect(result.current.mutateAsync('story-1')).rejects.toThrow(
        'You have no credits available'
      );
    });

    expect(toast.error).toHaveBeenCalledWith('You have no credits available');
  });
});
