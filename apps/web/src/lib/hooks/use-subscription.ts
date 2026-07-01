'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  createCheckoutSessionRequest,
  createBillingPortalSessionRequest,
} from '@/lib/api/subscription';

export function useCreateCheckout() {
  const t = useTranslations('subscription');

  return useMutation({
    mutationFn: () => createCheckoutSessionRequest(),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) =>
      toast.error(error.message || t('errors.checkoutFailed')),
  });
}

export function useCreateBillingPortal() {
  const t = useTranslations('subscription');

  return useMutation({
    mutationFn: () => createBillingPortalSessionRequest(),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) =>
      toast.error(error.message || t('errors.portalFailed')),
  });
}
