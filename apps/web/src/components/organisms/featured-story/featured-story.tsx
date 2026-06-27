'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Star,
} from 'lucide-react';
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
    <section className="shadow-card relative overflow-hidden rounded-[28px] bg-[#3a0d16] sm:rounded-[36px]">
      <div className="grid min-h-[460px] grid-cols-1 lg:min-h-[560px] lg:grid-cols-2">
        {/* Right: cover image (renders first in DOM for layering on the left fade) */}
        <div className="relative order-1 min-h-[220px] lg:order-2 lg:min-h-full">
          {story.coverImageUrl ? (
            <Image
              src={story.coverImageUrl}
              alt={story.title}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15]" />
          )}
          {/* Fade the image into the maroon panel */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#3a0d16]/85 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#3a0d16] lg:via-[#3a0d16]/40 lg:to-transparent" />
        </div>

        {/* Left: maroon text panel */}
        <div className="relative z-10 order-2 flex flex-col justify-center p-7 sm:p-12 lg:order-1">
          <div>
            <div className="border-gold/40 text-gold mb-6 inline-flex items-center gap-2 rounded-xl border bg-black/20 px-4 py-2 text-[11px] font-bold tracking-[0.12em] uppercase sm:text-xs">
              <Star className="fill-gold size-3.5" />
              {t('badge')}
            </div>

            <h1 className="font-heading text-[2.75rem] leading-[0.98] font-semibold tracking-tight text-[#fff9ef] sm:text-6xl">
              {story.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-[#fff9ef]/75 sm:text-base">
              <span className="inline-flex items-center gap-1.5">
                <Search className="size-4" />
                {tGenre(story.genre)}
              </span>
              <span className="text-[#fff9ef]/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {t('duration', { minutes: story.estimatedDurationMinutes })}
              </span>
              <span className="text-[#fff9ef]/30">|</span>
              <span
                className={cn(
                  'font-semibold',
                  story.isFree ? 'text-gold' : 'text-[#fff9ef]'
                )}
              >
                {story.isFree ? t('free') : t('premium')}
              </span>
            </div>

            <p className="mt-6 max-w-md text-base leading-7 text-[#fff9ef]/85 sm:text-lg sm:leading-8">
              {story.teaser}
            </p>

            <button
              className="shadow-button mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-4 text-base font-bold text-[#4a111b] transition hover:scale-[1.01] sm:w-auto sm:min-w-72"
              type="button"
            >
              {t('startButton')}
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {hasMultiple && (
        <>
          <button
            className="border-gold/30 text-gold absolute top-1/2 left-4 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border bg-black/30 backdrop-blur transition hover:bg-black/50"
            onClick={() => goTo(current - 1)}
            type="button"
            aria-label={t('previous')}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="border-gold/30 text-gold absolute top-1/2 right-4 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border bg-black/30 backdrop-blur transition hover:bg-black/50"
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
                  index === current ? 'bg-gold w-8' : 'w-2 bg-[#fff9ef]/40'
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
