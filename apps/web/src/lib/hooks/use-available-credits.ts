'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client-fetch';
import { config } from '@/lib/config';

export const AVAILABLE_CREDITS_QUERY_KEY = ['availableCredits'] as const;

interface AvailableCreditsResponse {
  availableCredits: number;
}

async function fetchAvailableCredits(): Promise<number> {
  const body = await clientFetch<AvailableCreditsResponse>(
    config.routes.meCreditsApi
  );
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
