import { notFound } from 'next/navigation';
import { StatusCodes } from 'http-status-codes';
import { fetchStory } from '@/lib/api/story';
import { fetchSessions } from '@/lib/api/session';
import { fetchAvailableCredits } from '@/lib/api/credits-server';
import { fetchSubscription } from '@/lib/api/subscription-data';
import { ApiError } from '@/lib/api/client';
import { isActiveSubscription } from '@/lib/types/subscription';
import { StoryDetailContent } from '@/components/organisms';

export default async function StoryStartPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;

  let story: Awaited<ReturnType<typeof fetchStory>>;
  try {
    story = await fetchStory(storyId);
  } catch (error) {
    if (error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) {
      notFound();
    }
    throw error;
  }

  let activeSessionId: string | null = null;
  try {
    const sessions = await fetchSessions(1, 50, 'active');
    const active = sessions.items.find((s) => s.storyId === storyId);
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
      story={story}
      activeSessionId={activeSessionId}
      availableCredits={availableCredits}
      hasActiveSubscription={hasActiveSubscription}
    />
  );
}
