'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { loginRequest, logoutRequest } from '@/lib/api/auth';
import { config } from '@/lib/config';
import type { LoginPayload } from '@/lib/types/auth';

export function useLogin() {
  const router = useRouter();
  const t = useTranslations('auth');

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: () => {
      toast.success(t('welcome'));
      router.push(config.routes.home);
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t('errors.loginFailed')),
  });
}

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => logoutRequest(),
    onSettled: () => {
      router.push(config.routes.login);
      router.refresh();
    },
  });
}
