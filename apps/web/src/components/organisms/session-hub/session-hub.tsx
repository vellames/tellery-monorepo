'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Gavel,
  KeyRound,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';
import type {
  SessionCharacter,
  SessionLocation,
  SessionObject,
  SessionState,
} from '@/lib/types/session';
import {
  InvestigationPanel,
  type InvestigationTarget,
  type InvestigationTargetKind,
} from './investigation-panel';

export interface SessionHubProps {
  session: SessionState;
}

const SESSION_STATUS_SOLVED = 'completed';

export function SessionHub({ session }: SessionHubProps) {
  const t = useTranslations('play');
  const tGenre = useTranslations('common.genres');
  const router = useRouter();
  const {
    id: sessionId,
    history,
    clues,
    cluesTotal,
    characters,
    locations,
    objects,
  } = session;

  const [targetRef, setTargetRef] = useState<{
    kind: InvestigationTargetKind;
    id: string;
  } | null>(null);
  const [easyMode, setEasyMode] = useState(false);

  const target = useMemo<InvestigationTarget | null>(() => {
    if (!targetRef) return null;
    if (targetRef.kind === 'character') {
      const data = characters.find((c) => c.id === targetRef.id);
      return data ? { kind: 'character', data } : null;
    }
    if (targetRef.kind === 'object') {
      const data = objects.find((o) => o.id === targetRef.id);
      return data ? { kind: 'object', data } : null;
    }
    const data = locations.find((l) => l.id === targetRef.id);
    return data ? { kind: 'location', data } : null;
  }, [targetRef, characters, objects, locations]);

  const handleInteracted = useMemo(() => () => router.refresh(), [router]);

  const foundClues = clues.length;
  const progressPct =
    cluesTotal > 0 ? Math.round((foundClues / cluesTotal) * 100) : 0;
  const isSolved = session.status === SESSION_STATUS_SOLVED;

  const questionedCount = useMemo(
    () => characters.filter((c) => c.messages.length > 0).length,
    [characters]
  );
  const exploredCount = useMemo(
    () =>
      locations.filter((l) => l.visited).length +
      objects.filter((o) => o.inspected).length,
    [locations, objects]
  );

  return (
    <div className="flex flex-col gap-10 pb-12">
      <Link
        className="group inline-flex items-center gap-2 self-start text-sm font-semibold text-[#fff9ef]/55 transition hover:text-[#fff9ef]"
        href={config.routes.stories}
      >
        <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" />
        {t('back')}
      </Link>

      {/* ── Cinematic case header ─────────────────────────────────────── */}
      <header className="scene-reveal scene-grain scene-vignette relative overflow-hidden rounded-[28px] border border-[#fff9ef]/10 sm:rounded-[36px]">
        <div className="relative min-h-[340px] sm:min-h-[420px]">
          {history.coverImageUrl ? (
            <Image
              src={history.coverImageUrl}
              alt={history.title}
              fill
              priority
              className="scale-105 object-cover"
              sizes="(min-width: 1024px) 900px, 100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120406] via-[#120406]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#120406]/80 via-transparent to-transparent" />

          <button
            type="button"
            onClick={() => setEasyMode((v) => !v)}
            aria-pressed={easyMode}
            aria-label={t('easyMode')}
            title={t('easyMode')}
            className={cn(
              'absolute top-4 right-4 z-10 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide backdrop-blur transition',
              easyMode
                ? 'border-gold/50 bg-gold/20 text-gold'
                : 'border-[#fff9ef]/15 bg-black/30 text-[#fff9ef]/60 hover:text-[#fff9ef]'
            )}
          >
            <Sparkles className="size-3.5" />
            {t('easyMode')}
          </button>

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase backdrop-blur',
                  isSolved
                    ? 'border-success/50 bg-success/15 text-[#b9e4c5]'
                    : 'border-gold/40 text-gold bg-black/35'
                )}
              >
                {isSolved ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <span className="scene-glow-breathe bg-gold size-1.5 rounded-full" />
                )}
                {isSolved ? t('statusSolved') : t('statusActive')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fff9ef]/15 bg-black/30 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#fff9ef]/80 uppercase backdrop-blur">
                <Search className="size-3.5" />
                {tGenre(history.genre)}
              </span>
            </div>

            <h1 className="font-heading max-w-2xl text-4xl leading-[0.98] font-semibold tracking-tight text-[#fff9ef] drop-shadow-sm sm:text-6xl">
              {history.title}
            </h1>
            {history.subtitle && (
              <p className="max-w-xl text-sm leading-relaxed text-[#fff9ef]/70 sm:text-base">
                {history.subtitle}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ── Progress bar (under the banner) ───────────────────────────── */}
      <ProgressBar
        pct={progressPct}
        foundClues={foundClues}
        cluesTotal={cluesTotal}
        questionedCount={questionedCount}
        exploredCount={exploredCount}
        cluesLabel={t('cluesUnit')}
        progressLabel={t('progress')}
      />

      {/* ── Briefing (compact) ────────────────────────────────────────── */}
      <p
        className="scene-reveal text-sm leading-6 text-[#fff9ef]/60 italic"
        style={{ animationDelay: '120ms' }}
      >
        {history.opening}
      </p>

      {/* ── Objective ─────────────────────────────────────────────────── */}
      <section
        className="scene-reveal border-gold/30 relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[#4a111b]/60 to-[#120406]/30 p-6 sm:p-7"
        style={{ animationDelay: '140ms' }}
      >
        <div className="flex items-start gap-4">
          <div className="border-gold/40 text-gold grid size-11 shrink-0 place-items-center rounded-2xl border bg-black/25">
            <Target className="size-5" />
          </div>
          <div>
            <h2 className="text-gold text-xs font-bold tracking-[0.16em] uppercase">
              {t('objective')}
            </h2>
            <p className="mt-1.5 leading-7 text-[#fff9ef]/90">
              {history.objective}
            </p>
          </div>
        </div>
      </section>

      {/* ── Investigation board ───────────────────────────────────────── */}
      <section
        className="scene-reveal flex flex-col gap-6"
        style={{ animationDelay: '200ms' }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-heading inline-flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            <Compass className="text-gold size-6" />
            {t('leadsHeading')}
          </h2>
          <p className="text-sm text-[#fff9ef]/55">{t('leadsSubtitle')}</p>
        </div>

        {locations.length > 0 && (
          <BoardGroup
            icon={MapPin}
            title={t('places')}
            count={locations.length}
          >
            {locations.map((location) => {
              const locationObjects = objects.filter(
                (o) => o.locationId === location.id
              );
              const effectiveCluesTotal =
                location.cluesTotal +
                locationObjects.reduce((sum, o) => sum + o.cluesTotal, 0);
              const effectiveCluesFound =
                location.discoveredClues.length +
                locationObjects.reduce(
                  (sum, o) => sum + o.discoveredClues.length,
                  0
                );
              return (
                <LeadCard
                  key={location.id}
                  name={location.name}
                  description={location.shortDescription}
                  imageUrl={location.imageUrl}
                  cluesLabel={
                    effectiveCluesTotal === 0
                      ? t('noCluesAvailable')
                      : easyMode
                        ? t('cluesHereEasy', {
                            found: effectiveCluesFound,
                            total: effectiveCluesTotal,
                          })
                        : t('cluesHere', {
                            count: effectiveCluesFound,
                          })
                  }
                  easyMode={easyMode}
                  cluesFound={effectiveCluesFound}
                  cluesTotal={effectiveCluesTotal}
                  done={location.visited}
                  doneLabel={t('visited')}
                  pendingLabel={t('notVisited')}
                  ctaLabel={t('tapToInvestigate')}
                  accent="emerald"
                  onClick={() =>
                    setTargetRef({ kind: 'location', id: location.id })
                  }
                />
              );
            })}
          </BoardGroup>
        )}

        {characters.length > 0 && (
          <BoardGroup
            icon={Users}
            title={t('people')}
            count={characters.length}
          >
            {characters.map((character) => (
              <LeadCard
                key={character.id}
                name={character.name}
                meta={character.role}
                description={character.shortDescription}
                imageUrl={character.imageUrl}
                cluesLabel={
                  character.cluesTotal === 0
                    ? t('noCluesAvailable')
                    : easyMode
                      ? t('cluesHereEasy', {
                          found: character.discoveredClues.length,
                          total: character.cluesTotal,
                        })
                      : t('cluesHere', {
                          count: character.discoveredClues.length,
                        })
                }
                easyMode={easyMode}
                cluesFound={character.discoveredClues.length}
                cluesTotal={character.cluesTotal}
                done={character.messages.length > 0}
                doneLabel={t('questioned')}
                pendingLabel={t('notQuestioned')}
                ctaLabel={t('tapToQuestion')}
                accent="rose"
                portrait
                onClick={() =>
                  setTargetRef({ kind: 'character', id: character.id })
                }
              />
            ))}
          </BoardGroup>
        )}
      </section>

      {/* ── Evidence collected ────────────────────────────────────────── */}
      <section
        className="scene-reveal flex flex-col gap-4"
        style={{ animationDelay: '260ms' }}
      >
        <h2 className="font-heading inline-flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl">
          <KeyRound className="text-gold size-6" />
          {t('evidenceHeading')}
          {foundClues > 0 && (
            <span className="text-gold/90 bg-gold/10 ring-gold/20 rounded-full px-2.5 py-0.5 text-sm font-bold ring-1">
              {foundClues}
            </span>
          )}
        </h2>

        {clues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#fff9ef]/15 bg-[#fff9ef]/[0.02] px-6 py-10 text-center">
            <Sparkles className="mx-auto size-7 text-[#fff9ef]/30" />
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#fff9ef]/50">
              {t('evidenceEmpty')}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {clues.map((clue) => (
              <article
                key={clue.id}
                className="group border-clue-border/30 relative overflow-hidden rounded-2xl border bg-[#fff4d8]/[0.05] p-4"
              >
                <div className="bg-gold absolute top-0 left-0 h-full w-1" />
                <h3 className="font-heading pl-2 text-lg font-semibold tracking-tight text-[#fff9ef]">
                  {clue.title}
                </h3>
                <p className="mt-1 pl-2 text-sm leading-6 text-[#fff9ef]/65">
                  {clue.description}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div
        className="scene-reveal sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#fff9ef]/10 bg-[#1b070b]/80 p-3 backdrop-blur-xl sm:flex-row"
        style={{ animationDelay: '320ms' }}
      >
        <button
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#fff9ef]/15 px-6 py-4 text-sm font-bold text-[#fff9ef]/85 transition hover:bg-[#fff9ef]/[0.06]"
          type="button"
        >
          <KeyRound className="size-4" />
          {t('viewClues')}
        </button>
        <button
          className="shadow-button scene-shimmer text-gold-foreground inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-6 py-4 text-sm font-bold transition hover:scale-[1.01]"
          type="button"
        >
          <Gavel className="size-4" />
          {t('solveCase')}
        </button>
      </div>

      <InvestigationPanel
        sessionId={sessionId}
        target={target}
        objects={objects}
        easyMode={easyMode}
        onSelectObject={(object) =>
          setTargetRef({ kind: 'object', id: object.id })
        }
        onInteracted={handleInteracted}
        onClose={() => setTargetRef(null)}
      />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */

function ProgressBar({
  pct,
  foundClues,
  cluesTotal,
  questionedCount,
  exploredCount,
  cluesLabel,
  progressLabel,
}: {
  pct: number;
  foundClues: number;
  cluesTotal: number;
  questionedCount: number;
  exploredCount: number;
  cluesLabel: string;
  progressLabel: string;
}) {
  return (
    <section
      className="scene-reveal -mt-4 flex flex-col gap-3 rounded-3xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.04] px-5 py-4 sm:px-7 sm:py-5"
      style={{ animationDelay: '60ms' }}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <span className="font-heading text-gold text-3xl leading-none font-semibold sm:text-4xl">
            {pct}%
          </span>
          <span className="text-[11px] font-bold tracking-[0.14em] text-[#fff9ef]/45 uppercase">
            {progressLabel}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm sm:gap-5">
          <Stat
            icon={KeyRound}
            value={`${foundClues}/${cluesTotal}`}
            label={cluesLabel}
          />
          <span className="hidden items-center sm:inline-flex">
            <Stat icon={MessageCircle} value={questionedCount} label="" />
          </span>
          <span className="hidden items-center sm:inline-flex">
            <Stat icon={Compass} value={exploredCount} label="" />
          </span>
        </div>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#fff9ef]/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f] transition-[width] duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof KeyRound;
  value: number | string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[#fff9ef]/70">
      <Icon className="text-gold size-4" />
      <span className="font-semibold text-[#fff9ef]">{value}</span>
      {label && <span className="text-[#fff9ef]/55">{label}</span>}
    </span>
  );
}

function BoardGroup({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof Users;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#fff9ef]/60 uppercase">
        <Icon className="text-gold size-4" />
        {title}
        <span className="text-[#fff9ef]/35">· {count}</span>
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

const ACCENT_RING: Record<string, string> = {
  emerald: 'group-hover:border-success/50',
  amber: 'group-hover:border-gold/50',
  rose: 'group-hover:border-[#e88a96]/50',
};

function LeadCard({
  name,
  meta,
  description,
  imageUrl,
  cluesLabel,
  easyMode,
  cluesFound,
  cluesTotal,
  done,
  doneLabel,
  pendingLabel,
  ctaLabel,
  accent,
  portrait,
  onClick,
}: {
  name: string;
  meta?: string;
  description: string;
  imageUrl?: string | null;
  cluesLabel: string;
  easyMode: boolean;
  cluesFound: number;
  cluesTotal: number;
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
  ctaLabel: string;
  accent: 'emerald' | 'amber' | 'rose';
  portrait?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] text-left transition duration-300 hover:-translate-y-1 hover:bg-[#fff9ef]/[0.06]',
        ACCENT_RING[accent]
      )}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden',
          portrait ? 'aspect-[4/3]' : 'aspect-video'
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] to-[#160a08]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120406] via-[#120406]/20 to-transparent" />

        <span
          className={cn(
            'absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase backdrop-blur',
            done
              ? 'bg-success/25 text-[#b9e4c5] ring-1 ring-[#b9e4c5]/30'
              : 'bg-black/40 text-[#fff9ef]/70 ring-1 ring-[#fff9ef]/15'
          )}
        >
          {done && <CheckCircle2 className="size-3" />}
          {done ? doneLabel : pendingLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h4 className="font-heading text-lg leading-tight font-semibold tracking-tight text-[#fff9ef]">
          {name}
        </h4>
        {meta && (
          <p className="text-gold text-[11px] font-semibold tracking-wide uppercase">
            {meta}
          </p>
        )}
        <p className="line-clamp-2 text-sm leading-6 text-[#fff9ef]/60">
          {description}
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gold/80 text-xs font-medium">
              {cluesLabel}
            </span>
            <span className="text-[11px] font-bold text-[#fff9ef]/0 transition group-hover:text-[#fff9ef]/80">
              {ctaLabel} →
            </span>
          </div>
          {easyMode && cluesTotal > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#fff9ef]/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f] transition-[width] duration-700"
                style={{
                  width: `${Math.round((cluesFound / cluesTotal) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export type { SessionCharacter, SessionLocation, SessionObject };
