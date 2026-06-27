import Image from 'next/image';
import { Clock, Lock, MapPin, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { History } from '@/lib/types/history';

export interface StoryCardProps {
  history: History;
  featured?: boolean;
}

export function StoryCard({ history, featured = false }: StoryCardProps) {
  const t = useTranslations('home.upcoming');
  const tGenre = useTranslations('common.genres');
  const tCommon = useTranslations('common');

  const image = history.thumbnailUrl ?? history.coverImageUrl;

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

  return (
    <article
      className={cn(
        'group shadow-card relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-700 to-zinc-500',
        featured ? 'aspect-[4/3]' : 'aspect-[4/5]'
      )}
    >
      {image && (
        <Image
          src={image}
          alt={history.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes={
            featured
              ? '(min-width: 768px) 50vw, 100vw'
              : '(min-width: 768px) 33vw, 100vw'
          }
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
        {accessBadge}
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
    </article>
  );
}
