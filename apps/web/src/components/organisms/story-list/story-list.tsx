import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { config } from '@/lib/config';
import { StoryCard } from '@/components/molecules';
import type { Story } from '@/lib/types/story';
import type { CompletedStoryMap } from '@/lib/types/session';

export interface StoryListProps {
  stories: Story[];
  completedMap?: CompletedStoryMap;
}

export function StoryList({ stories, completedMap = {} }: StoryListProps) {
  const t = useTranslations('home.upcoming');

  if (stories.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-heading text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('title')}
        </h2>
        <Link
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm font-semibold transition"
          href={config.routes.stories}
        >
          {t('seeAll')}
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stories.map((story) => (
          <StoryCard
            story={story}
            key={story.id}
            endingType={completedMap[story.id] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
