'use client';

import {
  QueryClient,
  QueryCache,
  MutationCache,
  isServer,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api/error';

function makeQueryClient(): QueryClient {
  const onError = (error: unknown) => {
    toast.error(extractErrorMessage(error));
  };

  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, retry: 1 },
    },
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
