import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, MapPin, Target, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { config } from '@/lib/config';
import type { SessionState } from '@/lib/types/session';

export interface SessionHubProps {
  session: SessionState;
}

export function SessionHub({ session }: SessionHubProps) {
  const t = useTranslations('play');
  const tGenre = useTranslations('common.genres');
  const { history, clues, cluesTotal, characters, locations } = session;

  const foundClues = clues.length;
  const progressPct =
    cluesTotal > 0 ? Math.round((foundClues / cluesTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Link
          className="hover:text-gold inline-flex items-center gap-2 self-start text-sm font-semibold text-[#fff9ef]/60 transition"
          href={config.routes.stories}
        >
          <ArrowLeft className="size-4" />
          {t('back')}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {history.title}
            </h1>
            <p className="text-sm font-medium text-[#fff9ef]/60">
              {tGenre(history.genre)}
            </p>
          </div>
          <BookOpen className="text-gold mt-1 size-7 shrink-0" />
        </div>
      </header>

      <p className="text-lg leading-8 text-[#fff9ef]/75 italic">
        {history.opening}
      </p>

      <section className="border-gold/25 rounded-3xl border bg-[#fff9ef]/[0.04] p-6">
        <h2 className="text-gold mb-2 inline-flex items-center gap-2 text-sm font-bold tracking-[0.1em] uppercase">
          <Target className="size-4" />
          {t('objective')}
        </h2>
        <p className="leading-7 text-[#fff9ef]/85">{history.objective}</p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {t('progress')}
          </h2>
          <span className="text-sm font-medium text-[#fff9ef]/60">
            {t('cluesFound', { found: foundClues, total: cluesTotal })}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#fff9ef]/10">
          <div
            className="bg-gold h-full rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </section>

      {characters.length > 0 && (
        <EntitySection
          icon={Users}
          title={t('people')}
          items={characters.map((c) => ({
            id: c.id,
            name: c.name,
            meta: c.role,
            description: c.shortDescription,
            imageUrl: c.imageUrl,
          }))}
        />
      )}

      {locations.length > 0 && (
        <EntitySection
          icon={MapPin}
          title={t('places')}
          items={locations.map((l) => ({
            id: l.id,
            name: l.name,
            description: l.shortDescription,
            imageUrl: l.imageUrl,
          }))}
        />
      )}

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button
          className="border-gold/40 text-gold inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-6 py-4 text-sm font-bold transition hover:bg-[#fff9ef]/[0.04]"
          type="button"
        >
          {t('viewClues')}
        </button>
        <button
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-6 py-4 text-sm font-bold text-[#4a111b] transition hover:scale-[1.01]"
          type="button"
        >
          {t('solveCase')}
        </button>
      </div>
    </div>
  );
}

interface EntitySectionItem {
  id: string;
  name: string;
  meta?: string;
  description: string;
  imageUrl?: string | null;
}

function EntitySection({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Users;
  title: string;
  items: EntitySectionItem[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-[#fff9ef]">
        <Icon className="text-gold size-5" />
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article
            className="flex gap-4 rounded-2xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.04] p-4"
            key={item.id}
          >
            {item.imageUrl && (
              <Image
                alt={item.name}
                src={item.imageUrl}
                width={72}
                height={72}
                className="size-18 shrink-0 rounded-xl border border-[#fff9ef]/10 object-cover"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-semibold tracking-tight">
                {item.name}
              </h3>
              {item.meta && (
                <p className="text-gold mt-0.5 text-xs font-semibold tracking-wide uppercase">
                  {item.meta}
                </p>
              )}
              <p className="mt-1.5 text-sm leading-6 text-[#fff9ef]/65">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
