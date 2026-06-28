import {
  fetchFeaturedHistories,
  fetchUpcomingHistories,
} from '@/lib/api/history';
import { FeaturedStory, HowItWorks, StoryList } from '@/components/organisms';

export default async function HomePage() {
  const [histories, upcoming] = await Promise.all([
    fetchFeaturedHistories(),
    fetchUpcomingHistories(),
  ]);

  return (
    <>
      <FeaturedStory histories={histories} />
      <HowItWorks />
      <StoryList histories={upcoming} />
    </>
  );
}
