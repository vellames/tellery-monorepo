'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import type { Story } from '@/lib/types/story';

const AUTO_SLIDE_INTERVAL_MS = 12000;

export interface FeaturedStoryProps {
  stories: Story[];
  showBadge?: boolean;
}

export function FeaturedStory({
  stories,
  showBadge = true,
}: FeaturedStoryProps) {
  const t = useTranslations('home.featured');
  const tGenre = useTranslations('common.genres');
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoSlide, setAutoSlide] = useState(true);

  useEffect(() => {
    if (stories.length <= 1 || paused || !autoSlide) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % stories.length);
    }, AUTO_SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [current, stories.length, paused, autoSlide]);

  if (stories.length === 0) return null;

  const hasMultiple = stories.length > 1;

  const selectSlide = (index: number) => {
    setAutoSlide(false);
    setCurrent((index + stories.length) % stories.length);
  };

  return (
    <section
      className="shadow-card relative overflow-hidden rounded-[28px] bg-[#3a0d16] sm:rounded-[36px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {stories.map((story) => (
          <div className="w-full shrink-0" key={story.id}>
            <div className="grid min-h-[460px] grid-cols-1 lg:min-h-[560px] lg:grid-cols-5">
              {/* Right: cover image (renders first in DOM for layering on the left fade) */}
              <div className="relative order-1 min-h-[220px] lg:order-2 lg:col-span-3 lg:min-h-full">
                {story.coverImageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={story.coverImageUrl}
                    alt={story.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15]" />
                )}
                {/* Fade the image into the maroon panel */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#3a0d16]/85 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#3a0d16] lg:via-[#3a0d16]/40 lg:to-transparent" />
              </div>

              {/* Left: maroon text panel */}
              <div className="relative z-10 order-2 flex flex-col justify-center p-7 pb-16 sm:p-12 lg:order-1 lg:col-span-2 lg:pb-12 lg:pl-20">
                <div>
                  {showBadge && (
                    <div className="border-gold/40 text-gold mb-6 inline-flex items-center gap-2 rounded-xl border bg-black/20 px-4 py-2 text-[11px] font-bold tracking-[0.12em] uppercase sm:text-xs">
                      <Star className="fill-gold size-3.5" />
                      {t('badge')}
                    </div>
                  )}

                  <h1 className="font-heading text-4xl leading-[0.98] font-semibold tracking-tight text-[#fff9ef] sm:text-5xl">
                    {story.title}
                  </h1>

                  <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-[#fff9ef]/75 sm:text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Search className="size-4" />
                      {tGenre(story.genre)}
                    </span>
                    <span className="text-[#fff9ef]/40">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4" />
                      {t('duration', {
                        minutes: story.estimatedDurationMinutes,
                      })}
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

                  <p className="mt-5 max-w-md text-sm leading-7 text-[#fff9ef]/85 sm:text-base sm:leading-7">
                    {story.teaser}
                  </p>

                  <Link
                    className="shadow-button mt-7 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-7 py-3.5 text-sm font-bold text-[#4a111b] transition hover:scale-[1.01] sm:w-auto sm:min-w-64"
                    href={`/stories/${story.id}`}
                  >
                    {t('startButton')}
                    <ArrowRight className="size-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMultiple && (
        <>
          <button
            className="border-gold/30 text-gold absolute top-[88px] left-4 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border bg-black/30 backdrop-blur transition hover:bg-black/50 lg:top-1/2"
            onClick={() => selectSlide(current - 1)}
            type="button"
            aria-label={t('previous')}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="border-gold/30 text-gold absolute top-[88px] right-4 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border bg-black/30 backdrop-blur transition hover:bg-black/50 lg:top-1/2"
            onClick={() => selectSlide(current + 1)}
            type="button"
            aria-label={t('next')}
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {stories.map((_, index) => (
              <button
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === current ? 'bg-gold w-8' : 'w-2 bg-[#fff9ef]/40'
                )}
                key={index}
                onClick={() => selectSlide(index)}
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
