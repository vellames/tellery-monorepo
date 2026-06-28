'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';
import type { PaginatedSessions, SessionListItem } from '@/lib/types/session';

async function fetchPage(
  page: number,
  status: string
): Promise<PaginatedSessions> {
  const qs = `page=${page}&limit=6&status=${status}`;
  const res = await fetch(`/api/sessions?${qs}`);
  return (await res.json()) as PaginatedSessions;
}

export function SessionHistory({
  activeOnly = false,
}: {
  activeOnly?: boolean;
}) {
  if (activeOnly) {
    return <SessionSection status="active" compact />;
  }

  return (
    <div className="flex flex-col gap-12">
      <SessionSection status="active" />
      <SessionSection status="completed" />
    </div>
  );
}

function SessionSection({
  status,
  compact = false,
}: {
  status: 'active' | 'completed';
  compact?: boolean;
}) {
  const t = useTranslations('home.history');
  const tGenre = useTranslations('common.genres');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const isActive = status === 'active';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['sessions', status, page],
    queryFn: () => fetchPage(page, status),
  });

  const accumulated = data
    ? Array.from({ length: page }, (_, i) => i + 1).flatMap(
        (p) =>
          queryClient.getQueryData<PaginatedSessions>(['sessions', status, p])
            ?.items ?? []
      )
    : [];

  const hasMore = data ? page < data.totalPages : false;

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  if (isLoading) {
    if (compact) return null;
    return (
      <section>
        <h2 className="font-heading text-primary mb-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          {isActive ? t('continueTitle') : t('completedTitle')}
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </section>
    );
  }

  if (!data || accumulated.length === 0) {
    if (compact) return null;
    if (isActive) {
      return (
        <section>
          <h2 className="font-heading text-primary mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('continueTitle')}
          </h2>
          <p className="text-muted-foreground text-sm">{t('continueEmpty')}</p>
        </section>
      );
    }
    return null;
  }

  return (
    <section>
      <h2 className="font-heading text-primary mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">
        {isActive ? t('continueTitle') : t('completedTitle')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {isActive ? t('continueSubtitle') : t('completedSubtitle')}
      </p>

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
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="hover:bg-primary/5 text-muted-foreground inline-flex cursor-pointer items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50"
          >
            {isFetching && <Loader2 className="size-4 animate-spin" />}
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
      </div>

      <div className="p-4">
        <h3 className="font-heading text-lg leading-tight font-semibold tracking-tight">
          {session.title}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {tGenre(session.genre)}
        </p>
        <div className="mt-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
              isCompleted
                ? 'bg-foreground/5 text-foreground/60'
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
