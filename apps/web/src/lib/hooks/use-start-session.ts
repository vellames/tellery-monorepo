'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { startSessionRequest } from '@/lib/api/start-session';
import { config } from '@/lib/config';

export function useStartSession() {
  const router = useRouter();
  const t = useTranslations('stories');

  return useMutation({
    mutationFn: (historyId: string) => startSessionRequest(historyId),
    onSuccess: (data) => router.push(config.routes.session(data.sessionId)),
    onError: (error: Error) => toast.error(error.message || t('startError')),
  });
}
