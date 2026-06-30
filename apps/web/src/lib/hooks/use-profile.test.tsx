import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/api/profile', () => ({
  updateProfileRequest: vi.fn(),
}));

import { toast } from 'sonner';
import { updateProfileRequest } from '@/lib/api/profile';
import { useUpdateProfile } from '@/lib/hooks/use-profile';
import { renderHookWithProviders } from '@/test-utils';

const user = {
  id: '1',
  name: 'Ana Updated',
  email: 'ana.updated@b.c',
  createdAt: '',
  updatedAt: '',
};

describe('useUpdateProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refreshes the route and toasts on success', async () => {
    vi.mocked(updateProfileRequest).mockResolvedValue(user);
    const { result } = renderHookWithProviders(() => useUpdateProfile());

    await act(async () => {
      await result.current.mutateAsync({
        name: 'Ana Updated',
        email: 'ana.updated@b.c',
      });
    });

    expect(refreshMock).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('toasts the error on failure', async () => {
    vi.mocked(updateProfileRequest).mockRejectedValue(
      new Error('Email already in use')
    );
    const { result } = renderHookWithProviders(() => useUpdateProfile());

    await act(async () => {
      await expect(
        result.current.mutateAsync({ name: 'Ana', email: 'taken@b.c' })
      ).rejects.toThrow('Email already in use');
    });

    expect(toast.error).toHaveBeenCalledWith('Email already in use');
  });
});
