import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Search, Target } from 'lucide-react';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { fetchHistory } from '@/lib/api/history';
import { ApiError } from '@/lib/api/client';
import { config } from '@/lib/config';
import { startSessionAction } from '@/lib/actions/session';
import { StartSessionButton } from '@/components/molecules';

export default async function StoryStartPage({
  params,
}: {
  params: Promise<{ historyId: string }>;
}) {
  const { historyId } = await params;

  let history: Awaited<ReturnType<typeof fetchHistory>>;
  try {
    history = await fetchHistory(historyId);
  } catch (error) {
    if (error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) {
      notFound();
    }
    throw error;
  }

  const tObj = await getTranslations('stories');
  const tGenre = await getTranslations('common.genres');
  const tUpcoming = await getTranslations('home.upcoming');

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link
        className="text-muted-foreground hover:text-primary inline-flex items-center gap-2 self-start text-sm font-semibold transition"
        href={config.routes.stories}
      >
        <ArrowLeft className="size-4" />
        {tObj('backToStories')}
      </Link>

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

      <form action={startSessionAction.bind(null, history.id)}>
        <StartSessionButton />
      </form>
    </div>
  );
}
