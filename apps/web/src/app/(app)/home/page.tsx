import {
  fetchFeaturedHistories,
  fetchUpcomingHistories,
} from '@/lib/api/history';
import { fetchCompletedHistoryMap, fetchSessions } from '@/lib/api/session';
import { fetchSubscription } from '@/lib/api/subscription-data';
import { isActiveSubscription } from '@/lib/types/subscription';
import {
  FeaturedStory,
  HowItWorks,
  SessionHistory,
  StoryList,
} from '@/components/organisms';

export default async function HomePage() {
  const [histories, upcoming, sessions, completedMap, subscription] =
    await Promise.all([
      fetchFeaturedHistories(),
      fetchUpcomingHistories(),
      fetchSessions(1, 1),
      fetchCompletedHistoryMap(),
      fetchSubscription().catch(() => null),
    ]);

  const hasSessions = sessions.total > 0;
  const hasActiveSubscription = isActiveSubscription(subscription);
  const featuredHistories = hasActiveSubscription
    ? histories
    : histories.filter((history) => history.isFree);

  return (
    <>
      <FeaturedStory histories={featuredHistories} showBadge={!hasSessions} />
      <SessionHistory activeOnly />
      <HowItWorks />
      <StoryList histories={upcoming} completedMap={completedMap} />
    </>
  );
}
