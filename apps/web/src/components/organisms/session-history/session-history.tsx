'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Loader2, Play, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';
import type { PaginatedSessions, SessionListItem } from '@/lib/types/session';

async function fetchPage(page: number): Promise<PaginatedSessions> {
  const res = await fetch(`/api/sessions?page=${page}&limit=6`);
  const json = await res.json();
  return json as PaginatedSessions;
}

export function SessionHistory() {
  const t = useTranslations('home.history');
  const tGenre = useTranslations('common.genres');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['sessions', page],
    queryFn: () => fetchPage(page),
  });

  const accumulated = data
    ? Array.from({ length: page }, (_, i) => i + 1).flatMap(
        (p) =>
          queryClient.getQueryData<PaginatedSessions>(['sessions', p])?.items ??
          []
      )
    : [];

  const hasMore = data ? page < data.totalPages : false;

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <section>
        <h2 className="font-heading text-primary mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('title')}
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">{t('subtitle')}</p>
        <div className="border-muted rounded-2xl border border-dashed py-12 text-center">
          <Search className="text-muted-foreground/50 mx-auto mb-3 size-8" />
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-heading text-primary mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">
        {t('title')}
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">{t('subtitle')}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accumulated.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            t={t}
            tGenre={tGenre}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="hover:bg-primary/5 text-muted-foreground inline-flex cursor-pointer items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Clock className="size-4" />
            )}
            {t('more')}
          </button>
        </div>
      )}
    </section>
  );
}

function SessionCard({
  session,
  t,
  tGenre,
}: {
  session: SessionListItem;
  t: ReturnType<typeof useTranslations>;
  tGenre: ReturnType<typeof useTranslations>;
}) {
  const isCompleted = session.status === 'completed';
  const href = config.routes.session(session.id);

  return (
    <Link
      href={href}
      className="group bg-card relative block cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {session.thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={session.thumbnailUrl}
            alt={session.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 to-stone-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase backdrop-blur',
              isCompleted
                ? 'border-success/40 bg-black/40 text-[#b9e4c5]'
                : 'border-gold/40 bg-black/40 text-[#f4d78f]'
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <Play className="size-3" />
            )}
            {isCompleted ? t('statusCompleted') : t('statusActive')}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-heading text-lg leading-tight font-semibold tracking-tight">
          {session.title}
        </h3>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
          <span>{tGenre(session.genre)}</span>
        </div>
        <div className="mt-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
              isCompleted
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground'
            )}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="size-3.5" />
                {t('replay')}
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                {t('continue')}
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
