import {
  fetchFeaturedHistories,
  fetchUpcomingHistories,
} from '@/lib/api/history';
import { fetchCompletedHistoryMap, fetchSessions } from '@/lib/api/session';
import {
  FeaturedStory,
  HowItWorks,
  SessionHistory,
  StoryList,
} from '@/components/organisms';

export default async function HomePage() {
  const [histories, upcoming, sessions, completedMap] = await Promise.all([
    fetchFeaturedHistories(),
    fetchUpcomingHistories(),
    fetchSessions(1, 1),
    fetchCompletedHistoryMap(),
  ]);

  const hasSessions = sessions.total > 0;

  return (
    <>
      <FeaturedStory histories={histories} showBadge={!hasSessions} />
      <SessionHistory activeOnly />
      <HowItWorks />
      <StoryList histories={upcoming} completedMap={completedMap} />
    </>
  );
}
