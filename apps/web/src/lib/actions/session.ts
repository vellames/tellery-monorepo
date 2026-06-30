'use server';

import { redirect } from 'next/navigation';
import { startSession } from '@/lib/api/session';
import { refreshSessionUser } from '@/lib/api/me';
import { config } from '@/lib/config';

export async function startSessionAction(historyId: string): Promise<void> {
  const { sessionId } = await startSession(historyId);
  try {
    await refreshSessionUser();
  } catch {
    // Non-critical: the header may show a stale session count until the next login.
  }
  redirect(config.routes.session(sessionId));
}
