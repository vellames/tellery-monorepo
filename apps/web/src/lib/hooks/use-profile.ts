'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { updateProfileRequest, changePasswordRequest } from '@/lib/api/profile';
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
} from '@/lib/types/auth';

export function useUpdateProfile() {
  const router = useRouter();
  const t = useTranslations('profile');

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      updateProfileRequest(payload),
    onSuccess: () => {
      toast.success(t('saved'));
      router.refresh();
    },
  });
}

export function useChangePassword() {
  const t = useTranslations('profile.password');

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      changePasswordRequest(payload),
    onSuccess: () => toast.success(t('saved')),
  });
}
