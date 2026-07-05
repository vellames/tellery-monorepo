import { fetchFeaturedStories, fetchUpcomingStories } from '@/lib/api/story';
import { fetchCompletedStoryMap, fetchSessions } from '@/lib/api/session';
import { fetchSubscription } from '@/lib/api/subscription-data';
import { isActiveSubscription } from '@/lib/types/subscription';
import {
  FeaturedStory,
  HowItWorks,
  SessionStory,
  StoryList,
} from '@/components/organisms';

export default async function HomePage() {
  const [stories, upcoming, sessions, completedMap, subscription] =
    await Promise.all([
      fetchFeaturedStories(),
      fetchUpcomingStories(),
      fetchSessions(1, 1),
      fetchCompletedStoryMap(),
      fetchSubscription().catch(() => null),
    ]);

  const hasSessions = sessions.total > 0;
  const hasActiveSubscription = isActiveSubscription(subscription);
  const featuredStories = hasActiveSubscription
    ? stories
    : stories.filter((story) => story.isFree);

  return (
    <>
      <FeaturedStory stories={featuredStories} showBadge={!hasSessions} />
      <SessionStory activeOnly />
      <HowItWorks />
      <StoryList stories={upcoming} completedMap={completedMap} />
    </>
  );
}
