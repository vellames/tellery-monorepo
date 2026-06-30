'use server';

import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { startSession } from '@/lib/api/session';
import { refreshSessionUser } from '@/lib/api/me';
import { ApiError } from '@/lib/api/client';
import { config } from '@/lib/config';
import type { StartSessionState } from './session-state';

export async function startSessionAction(
  historyId: string,
  _prevState: StartSessionState,
  _formData: FormData
): Promise<StartSessionState> {
  const t = await getTranslations('stories');

  let sessionId: string;
  try {
    sessionId = (await startSession(historyId)).sessionId;
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message || t('startError') };
    }
    return { error: t('startError') };
  }

  // Refresh the user cookie so the header reflects the decremented session
  // count. Non-critical: failures must not block the redirect.
  await refreshSessionUser().catch(() => {});

  redirect(config.routes.session(sessionId));
}
