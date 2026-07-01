'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { startSessionRequest } from '@/lib/api/start-session';
import { config } from '@/lib/config';
import { AVAILABLE_CREDITS_QUERY_KEY } from '@/lib/hooks/use-available-credits';

export function useStartSession() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('stories');

  return useMutation({
    mutationFn: (historyId: string) => startSessionRequest(historyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AVAILABLE_CREDITS_QUERY_KEY });
      router.push(config.routes.session(data.sessionId));
    },
    onError: (error: Error) => toast.error(error.message || t('startError')),
  });
}
