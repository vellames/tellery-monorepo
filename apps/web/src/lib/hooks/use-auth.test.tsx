import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/api/auth', () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

import { toast } from 'sonner';
import { loginRequest, logoutRequest, registerRequest } from '@/lib/api/auth';
import { useLogin, useLogout, useRegister } from '@/lib/hooks/use-auth';
import { renderHookWithProviders } from '@/test-utils';

const user = {
  id: '1',
  name: 'Ana',
  email: 'a@b.c',
  ssn: null,
  createdAt: '',
  updatedAt: '',
};

describe('auth hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('useLogin', () => {
    it('redirects home and toasts on success', async () => {
      vi.mocked(loginRequest).mockResolvedValue(user);
      const { result } = renderHookWithProviders(() => useLogin());

      await act(async () => {
        await result.current.mutateAsync({ email: 'a@b.c', password: '123' });
      });

      expect(pushMock).toHaveBeenCalledWith('/home');
      expect(refreshMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('toasts the error on failure', async () => {
      vi.mocked(loginRequest).mockRejectedValue(new Error('creds'));
      const { result } = renderHookWithProviders(() => useLogin());

      await act(async () => {
        await expect(
          result.current.mutateAsync({ email: 'a@b.c', password: 'x' })
        ).rejects.toThrow('creds');
      });

      expect(toast.error).toHaveBeenCalledWith('creds');
    });
  });

  describe('useRegister', () => {
    it('resolves without redirecting', async () => {
      vi.mocked(registerRequest).mockResolvedValue();
      const { result } = renderHookWithProviders(() => useRegister());

      await act(async () => {
        await result.current.mutateAsync({
          name: 'Ana',
          email: 'a@b.c',
          password: '123456',
        });
      });

      expect(pushMock).not.toHaveBeenCalled();
    });

    it('toasts the error on failure', async () => {
      vi.mocked(registerRequest).mockRejectedValue(new Error('used'));
      const { result } = renderHookWithProviders(() => useRegister());

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            name: 'A',
            email: 'a@b.c',
            password: '123456',
          })
        ).rejects.toThrow('used');
      });

      expect(toast.error).toHaveBeenCalledWith('used');
    });
  });

  describe('useLogout', () => {
    it('calls the api and redirects to login', async () => {
      vi.mocked(logoutRequest).mockResolvedValue();
      const { result } = renderHookWithProviders(() => useLogout());

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(logoutRequest).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/');
    });
  });
});
