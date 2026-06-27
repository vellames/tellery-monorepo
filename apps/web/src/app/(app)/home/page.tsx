import { fetchFeaturedHistories } from '@/lib/api/history';
import { FeaturedStory, HowItWorks, StoryList } from '@/components/organisms';

export default async function HomePage() {
  const histories = await fetchFeaturedHistories();

  return (
    <>
      <FeaturedStory histories={histories} />
      <HowItWorks />
      <StoryList />
    </>
  );
}
