import Link from 'next/link';
import { CheckCircle2, Clock, Lock, MapPin, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { History } from '@/lib/types/history';

const ENDING_LABEL_KEY: Record<string, string> = {
  full_truth: 'endingFullTruth',
  partial_truth: 'endingPartialTruth',
  wrong_accusation: 'endingWrongAccusation',
};

const ENDING_BADGE_STYLES: Record<string, string> = {
  full_truth: 'border-gold/40 bg-gold/15 text-[#f4d78f]',
  partial_truth: 'border-amber-600/40 bg-amber-600/15 text-amber-400',
  wrong_accusation: 'border-red-600/40 bg-red-600/15 text-red-400',
};

export interface StoryCardProps {
  history: History;
  featured?: boolean;
  endingType?: string | null;
}

export function StoryCard({
  history,
  featured = false,
  endingType = null,
}: StoryCardProps) {
  const t = useTranslations('home.upcoming');
  const tGenre = useTranslations('common.genres');
  const tCommon = useTranslations('common');
  const tEnding = useTranslations('play');

  const image = history.thumbnailUrl ?? history.coverImageUrl;
  const endingLabelKey = endingType ? ENDING_LABEL_KEY[endingType] : null;

  const accessBadge = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur',
        history.isFree
          ? 'border-success/40 bg-black/30 text-[#b9e4c5]'
          : 'border-gold/40 bg-black/40 text-[#f4d78f]'
      )}
    >
      {!history.isFree && <Lock className="size-3.5" />}
      {history.isFree ? t('free') : t('premium')}
    </span>
  );

  const endingBadge = endingLabelKey ? (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur',
        ENDING_BADGE_STYLES[endingType!] ??
          'border-success/40 bg-black/30 text-[#b9e4c5]'
      )}
    >
      <CheckCircle2 className="size-3.5" />
      {tEnding(endingLabelKey)}
    </span>
  ) : null;

  return (
    <Link
      className={cn(
        'group shadow-card relative block cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-700 to-zinc-500',
        featured ? 'aspect-[4/3]' : 'aspect-[4/5]'
      )}
      href={`/stories/${history.id}`}
    >
      {image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={image}
          alt={history.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      <div
        className={cn(
          'absolute top-5 right-5 left-5 flex items-start',
          featured ? 'justify-between' : 'flex-col gap-2'
        )}
      >
        {featured && (
          <span className="border-gold/40 text-gold inline-flex items-center gap-1.5 rounded-lg border bg-black/40 px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase backdrop-blur">
            <Star className="fill-gold size-3.5" />
            {tCommon('featured')}
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          {accessBadge}
          {endingBadge}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="font-heading text-xl leading-tight font-semibold tracking-tight text-[#fff9ef] sm:text-2xl">
          {history.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#fff9ef]/75 sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> {tGenre(history.genre)}
          </span>
          <span className="text-[#fff9ef]/40">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />{' '}
            {t('duration', { minutes: history.estimatedDurationMinutes })}
          </span>
        </div>
      </div>
    </Link>
  );
}
