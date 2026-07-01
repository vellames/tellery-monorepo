'use client';

import { useMutation } from '@tanstack/react-query';
import {
  createCheckoutSessionRequest,
  createBillingPortalSessionRequest,
} from '@/lib/api/subscription';

export function useCreateCheckout() {
  return useMutation({
    mutationFn: () => createCheckoutSessionRequest(),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}

export function useCreateBillingPortal() {
  return useMutation({
    mutationFn: () => createBillingPortalSessionRequest(),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}
