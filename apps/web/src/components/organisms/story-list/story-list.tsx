'use client';

import { Clock, Lock, MapPin, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Story {
  title: string;
  category: string;
  durationMinutes: number;
  gradient: string;
}

const stories: Story[] = [
  {
    title: 'O Último Quarto',
    category: 'Mistério',
    durationMinutes: 15,
    gradient: 'from-stone-900 via-stone-700 to-zinc-500',
  },
  {
    title: 'A Carta Sem Remetente',
    category: 'Suspense',
    durationMinutes: 10,
    gradient: 'from-neutral-800 via-stone-600 to-amber-200',
  },
  {
    title: 'O Jantar dos Segredos',
    category: 'Drama investigativo',
    durationMinutes: 20,
    gradient: 'from-zinc-900 via-stone-700 to-orange-300',
  },
];

export function StoryList() {
  const t = useTranslations('home.upcoming');

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-heading text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('title')}
        </h2>
        <button
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm font-semibold transition"
          type="button"
        >
          {t('seeAll')}
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stories.map((story) => (
          <article
            className={`group shadow-card relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br ${story.gradient}`}
            key={story.title}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

            <span className="border-gold/40 absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-lg border bg-black/40 px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#f4d78f] uppercase backdrop-blur">
              <Lock className="size-3.5" /> {t('premium')}
            </span>

            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="font-heading text-xl leading-tight font-semibold tracking-tight text-[#fff9ef]">
                {story.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#fff9ef]/75">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {story.category}
                </span>
                <span className="text-[#fff9ef]/40">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" />{' '}
                  {t('duration', { minutes: story.durationMinutes })}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
