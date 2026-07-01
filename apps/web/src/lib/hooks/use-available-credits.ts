'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { config } from '@/lib/config';

export const AVAILABLE_CREDITS_QUERY_KEY = ['availableCredits'] as const;

async function fetchAvailableCredits(): Promise<number> {
  const res = await fetch(config.routes.meCreditsApi);
  const body = (await res.json().catch(() => null)) as {
    availableCredits?: number;
    error?: string;
  } | null;
  if (!res.ok || body?.availableCredits === undefined) {
    throw new Error(body?.error ?? '');
  }
  return body.availableCredits;
}

export function useAvailableCredits() {
  return useQuery({
    queryKey: AVAILABLE_CREDITS_QUERY_KEY,
    queryFn: fetchAvailableCredits,
    staleTime: 0,
  });
}

export function useInvalidateAvailableCredits() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: AVAILABLE_CREDITS_QUERY_KEY });
}
