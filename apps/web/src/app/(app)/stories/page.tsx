import {
  fetchFeaturedHistories,
  fetchNonFeaturedHistories,
} from '@/lib/api/history';
import { StoryCard } from '@/components/molecules';
import { getTranslations } from 'next-intl/server';

export default async function StoriesPage() {
  const [t, featured, rest] = await Promise.all([
    getTranslations('stories'),
    fetchFeaturedHistories(),
    fetchNonFeaturedHistories(),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <h1 className="font-heading text-primary text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('title')}
      </h1>

      {featured.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="font-heading text-primary text-2xl font-semibold tracking-tight">
            {t('featuredSection')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {featured.map((history) => (
              <StoryCard history={history} featured key={history.id} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="font-heading text-primary text-2xl font-semibold tracking-tight">
            {t('allSection')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {rest.map((history) => (
              <StoryCard history={history} key={history.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
