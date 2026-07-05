import Link from 'next/link';
import { ArrowLeft, Clock, Search, Target } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { config } from '@/lib/config';
import type { HistoryDetail } from '@/lib/types/history';
import { StoryStartActions } from '../story-start-actions/story-start-actions';

export interface StoryDetailContentProps {
  history: HistoryDetail;
  activeSessionId: string | null;
  availableCredits: number;
  hasActiveSubscription: boolean;
  /**
   * When true, hides the "back to stories" link. Useful for landing pages
   * (e.g. /ad-stories) where there is no stories catalog to go back to.
   */
  hideBackLink?: boolean;
  /**
   * When true, omits the start/continue CTA block. Useful for landing pages
   * that render the CTA in a more prominent spot (e.g. /ad-stories) and want
   * to avoid duplicating it inside the detail content.
   */
  hideStartActions?: boolean;
}

export async function StoryDetailContent({
  history,
  activeSessionId,
  availableCredits,
  hasActiveSubscription,
  hideBackLink = false,
  hideStartActions = false,
}: StoryDetailContentProps) {
  const tObj = await getTranslations('stories');
  const tGenre = await getTranslations('common.genres');
  const tUpcoming = await getTranslations('home.upcoming');

  const requiresSubscription = !history.isFree && !hasActiveSubscription;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {!hideBackLink && (
        <Link
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-2 self-start text-sm font-semibold transition"
          href={config.routes.stories}
        >
          <ArrowLeft className="size-4" />
          {tObj('backToStories')}
        </Link>
      )}

      <section className="shadow-card relative aspect-[16/10] overflow-hidden rounded-[28px] bg-gradient-to-br from-stone-900 via-stone-700 to-zinc-500 sm:aspect-[2/1]">
        {history.coverImageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={history.coverImageUrl}
            alt={history.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </section>

      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-primary text-3xl font-semibold tracking-tight sm:text-4xl">
          {history.title}
        </h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm font-medium">
          <span className="inline-flex items-center gap-1.5">
            <Search className="size-4" />
            {tGenre(history.genre)}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />
            {tUpcoming('duration', {
              minutes: history.estimatedDurationMinutes,
            })}
          </span>
        </div>
      </header>

      <p className="text-foreground/80 text-lg leading-8">{history.opening}</p>

      <section className="border-gold/30 bg-clue/60 border-l-accent rounded-3xl border p-6">
        <h2 className="font-heading text-gold-foreground mb-2 inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Target className="size-5" />
          {tObj('objective')}
        </h2>
        <p className="text-foreground/80 leading-7">{history.objective}</p>
      </section>

      {!hideStartActions && (
        <StoryStartActions
          historyId={history.id}
          activeSessionId={activeSessionId}
          availableCredits={availableCredits}
          requiresSubscription={requiresSubscription}
        />
      )}
    </div>
  );
}
