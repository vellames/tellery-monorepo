import Image from 'next/image';
import { Clock, Lock, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { History } from '@/lib/types/history';

export interface StoryCardProps {
  history: History;
}

export function StoryCard({ history }: StoryCardProps) {
  const t = useTranslations('home.upcoming');
  const tGenre = useTranslations('common.genres');

  const image = history.thumbnailUrl ?? history.coverImageUrl;

  return (
    <article className="group shadow-card relative aspect-[4/5] cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-700 to-zinc-500">
      {image && (
        <Image
          src={image}
          alt={history.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      <span
        className={cn(
          'absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur',
          history.isFree
            ? 'border-success/40 bg-black/30 text-[#b9e4c5]'
            : 'border-gold/40 bg-black/40 text-[#f4d78f]'
        )}
      >
        {!history.isFree && <Lock className="size-3.5" />}
        {history.isFree ? t('free') : t('premium')}
      </span>

      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="font-heading text-xl leading-tight font-semibold tracking-tight text-[#fff9ef]">
          {history.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#fff9ef]/75">
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
