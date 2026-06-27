import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StoryCard } from '@/components/molecules';
import type { History } from '@/lib/types/history';

export interface StoryListProps {
  histories: History[];
}

export function StoryList({ histories }: StoryListProps) {
  const t = useTranslations('home.upcoming');

  if (histories.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-heading text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('title')}
        </h2>
        <button
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm font-semibold transition"
          type="button"
        >
          {t('seeAll')}
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {histories.map((history) => (
          <StoryCard history={history} key={history.id} />
        ))}
      </div>
    </section>
  );
}
