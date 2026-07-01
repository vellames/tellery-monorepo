import { Suspense } from 'react';
import {
  fetchFeaturedHistories,
  fetchNonFeaturedHistories,
} from '@/lib/api/history';
import { fetchCompletedHistoryMap } from '@/lib/api/session';
import { StoryCard } from '@/components/molecules';
import { StoriesFilters } from '@/components/organisms';
import { getTranslations } from 'next-intl/server';

function resolveIsFreeFilter(value: string | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ isFree?: string }>;
}) {
  const { isFree: rawIsFree } = await searchParams;
  const isFree = resolveIsFreeFilter(rawIsFree);

  const [t, featured, rest, completedMap] = await Promise.all([
    getTranslations('stories'),
    fetchFeaturedHistories(isFree),
    fetchNonFeaturedHistories(isFree),
    fetchCompletedHistoryMap(),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <h1 className="font-heading text-primary text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('title')}
      </h1>

      <Suspense fallback={null}>
        <StoriesFilters />
      </Suspense>

      {featured.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="font-heading text-primary text-2xl font-semibold tracking-tight">
            {t('featuredSection')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {featured.map((history) => (
              <StoryCard
                history={history}
                featured
                key={history.id}
                endingType={completedMap[history.id] ?? null}
              />
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
              <StoryCard
                history={history}
                key={history.id}
                endingType={completedMap[history.id] ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
