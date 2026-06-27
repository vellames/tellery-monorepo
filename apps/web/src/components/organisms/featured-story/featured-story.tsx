'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Clock, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { History } from '@/lib/types/history';

export interface FeaturedStoryProps {
  histories: History[];
}

export function FeaturedStory({ histories }: FeaturedStoryProps) {
  const t = useTranslations('home.featured');
  const tGenre = useTranslations('common.genres');
  const [current, setCurrent] = useState(0);

  if (histories.length === 0) return null;

  const story = histories[current];
  const hasMultiple = histories.length > 1;

  const goTo = (index: number) => {
    setCurrent((index + histories.length) % histories.length);
  };

  return (
    <section className="shadow-card relative min-h-[400px] overflow-hidden rounded-[28px] sm:rounded-[36px] lg:min-h-[520px]">
      {story.coverImageUrl ? (
        <Image
          src={story.coverImageUrl}
          alt={story.title}
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1280px) 1280px, 100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

      <div className="absolute inset-0 z-10 flex flex-col justify-end p-7 sm:p-12">
        <div className="max-w-xl">
          <div className="border-gold/30 text-gold mb-7 inline-flex items-center gap-2 rounded-xl border bg-black/30 px-4 py-2 text-xs font-bold tracking-wide uppercase sm:text-sm">
            <Star className="fill-gold size-4" />
            {t('badge')}
          </div>
          <h1 className="font-heading text-card text-5xl leading-[0.95] font-semibold sm:text-7xl">
            {story.title}
          </h1>
          <div className="text-card/80 mt-7 flex flex-wrap items-center gap-3 text-sm font-medium sm:text-base">
            <span>{tGenre(story.genre)}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <Clock className="size-5" />{' '}
              {t('duration', { minutes: story.estimatedDurationMinutes })}
            </span>
            <span className="text-card/40">|</span>
            <span
              className={cn(
                'font-bold',
                story.isFree ? 'text-gold' : 'text-card'
              )}
            >
              {story.isFree ? t('free') : t('premium')}
            </span>
          </div>
          <p className="text-card/90 mt-7 max-w-md text-lg leading-8">
            {story.teaser}
          </p>
          <button
            className="shadow-button mt-8 inline-flex w-full items-center justify-center gap-8 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-4 text-lg font-bold text-[#4a111b] transition hover:scale-[1.01] sm:w-auto sm:min-w-80"
            type="button"
          >
            {t('startButton')}
            <ChevronRight className="size-6" />
          </button>
        </div>
      </div>

      {hasMultiple && (
        <>
          <button
            className="border-border bg-card/80 text-primary hover:bg-card absolute top-1/2 left-4 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border backdrop-blur transition"
            onClick={() => goTo(current - 1)}
            type="button"
            aria-label={t('previous')}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="border-border bg-card/80 text-primary hover:bg-card absolute top-1/2 right-4 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border backdrop-blur transition"
            onClick={() => goTo(current + 1)}
            type="button"
            aria-label={t('next')}
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {histories.map((_, index) => (
              <button
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === current ? 'bg-gold w-8' : 'bg-card/40 w-2'
                )}
                key={index}
                onClick={() => goTo(index)}
                type="button"
                aria-label={t('slide', { number: index + 1 })}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
