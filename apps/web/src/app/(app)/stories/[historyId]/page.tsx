import { notFound } from 'next/navigation';
import { StatusCodes } from 'http-status-codes';
import { fetchHistory } from '@/lib/api/history';
import { fetchSessions } from '@/lib/api/session';
import { fetchAvailableCredits } from '@/lib/api/credits-server';
import { fetchSubscription } from '@/lib/api/subscription-data';
import { ApiError } from '@/lib/api/client';
import { isActiveSubscription } from '@/lib/types/subscription';
import { StoryDetailContent } from '@/components/organisms';

export default async function StoryStartPage({
  params,
}: {
  params: Promise<{ historyId: string }>;
}) {
  const { historyId } = await params;

  let history: Awaited<ReturnType<typeof fetchHistory>>;
  try {
    history = await fetchHistory(historyId);
  } catch (error) {
    if (error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) {
      notFound();
    }
    throw error;
  }

  let activeSessionId: string | null = null;
  try {
    const sessions = await fetchSessions(1, 50, 'active');
    const active = sessions.items.find((s) => s.historyId === historyId);
    activeSessionId = active?.id ?? null;
  } catch {
    // ignore — treat as no active session
  }

  let availableCredits = 0;
  try {
    availableCredits = await fetchAvailableCredits();
  } catch {
    // ignore — treat as no credits
  }

  let subscription = null;
  try {
    subscription = await fetchSubscription();
  } catch {
    // ignore — treat as no active subscription
  }
  const hasActiveSubscription = isActiveSubscription(subscription);

  return (
    <StoryDetailContent
      history={history}
      activeSessionId={activeSessionId}
      availableCredits={availableCredits}
      hasActiveSubscription={hasActiveSubscription}
    />
  );
}
