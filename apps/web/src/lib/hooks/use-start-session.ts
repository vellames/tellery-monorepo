'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { startSessionRequest } from '@/lib/api/start-session';
import { config } from '@/lib/config';
import { AVAILABLE_CREDITS_QUERY_KEY } from '@/lib/hooks/use-available-credits';

export function useStartSession() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (historyId: string) => startSessionRequest(historyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AVAILABLE_CREDITS_QUERY_KEY });
      router.push(config.routes.session(data.sessionId));
    },
  });
}
