'use server';

import { redirect } from 'next/navigation';
import { startSession } from '@/lib/api/session';
import { config } from '@/lib/config';

export async function startSessionAction(historyId: string): Promise<void> {
  const { sessionId } = await startSession(historyId);
  redirect(config.routes.session(sessionId));
}
