'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Gavel,
  KeyRound,
  MapPin,
  Search,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';
import type {
  SessionCharacter,
  SessionClue,
  SessionLocation,
  SessionObject,
  SessionState,
} from '@/lib/types/session';
import {
  InvestigationPanel,
  type InvestigationTarget,
  type InvestigationTargetKind,
} from './investigation-panel';
import { ConclusionModal } from './conclusion-modal';
import { EndingScreen } from './ending-screen';

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
    requiredCluesTotal,
    characters,
    locations,
    objects,
    conclusionFields,
    ending,
  } = session;

  const [targetRef, setTargetRef] = useState<{
    kind: InvestigationTargetKind;
    id: string;
  } | null>(null);
  const [easyMode, setEasyMode] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showCase, setShowCase] = useState(false);
  const [showConclusion, setShowConclusion] = useState(false);
  const [showSolveLock, setShowSolveLock] = useState(false);

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
  const requiredCluesFound = clues.filter(
    (clue) => clue.importance === 'required'
  ).length;
  const canSolveCase = requiredCluesFound >= requiredCluesTotal;
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

  if (isSolved && ending) {
    return (
      <EndingScreen
        ending={ending}
        playAgainLabel={t('endingPlayAgain')}
        summaryLabel={t('endingSummary')}
        epilogueLabel={t('endingEpilogue')}
        scoreLabel={t('endingScore')}
        correctAnswersLabel={t('endingCorrectAnswers')}
        cluesDiscoveredLabel={t('endingCluesDiscovered')}
        requiredCluesLabel={t('endingRequiredClues')}
        endingTypeLabels={{
          full_truth: t('endingFullTruth'),
          partial_truth: t('endingPartialTruth'),
          wrong_accusation: t('endingWrongAccusation'),
        }}
      />
    );
  }

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
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={history.coverImageUrl}
              alt={history.title}
              className="absolute inset-0 h-full w-full scale-105 object-cover"
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

      {/* ── Review case button ────────────────────────────────────────── */}
      <button
        onClick={() => setShowCase(true)}
        className="scene-reveal hover:border-gold/30 flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] px-5 py-3 text-left transition hover:bg-[#fff9ef]/[0.06]"
        style={{ animationDelay: '80ms' }}
        type="button"
      >
        <Target className="text-gold/70 size-4 shrink-0" />
        <span className="line-clamp-1 flex-1 text-sm text-[#fff9ef]/60">
          {history.opening}
        </span>
        <span className="text-gold shrink-0 text-xs font-bold tracking-wide uppercase">
          {t('reviewCase')}
        </span>
      </button>

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

      {/* ── Fixed bottom action bar ───────────────────────────────────── */}
      <div className="h-24" />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#fff9ef]/10 bg-[#1b070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6">
          {/* compact progress */}
          <div className="hidden flex-1 items-center gap-2.5 sm:flex">
            <span className="text-gold font-heading text-lg leading-none font-semibold">
              {progressPct}%
            </span>
            <div className="h-1.5 max-w-32 flex-1 overflow-hidden rounded-full bg-[#fff9ef]/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f] transition-[width] duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#fff9ef]/45">
              {foundClues}/{cluesTotal}
            </span>
          </div>

          <button
            onClick={() => setShowEvidence(true)}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#fff9ef]/15 px-4 py-2.5 text-sm font-bold text-[#fff9ef]/85 transition hover:bg-[#fff9ef]/[0.06] sm:flex-none"
            type="button"
          >
            <KeyRound className="size-4" />
            {t('viewClues')}
            {foundClues > 0 && (
              <span className="text-gold/90 bg-gold/10 ring-gold/20 rounded-full px-1.5 py-0.5 text-[11px] font-bold ring-1">
                {foundClues}
              </span>
            )}
          </button>
          <div className="relative flex flex-1 sm:flex-none">
            <button
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none',
                canSolveCase
                  ? 'shadow-button text-gold-foreground cursor-pointer bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] hover:scale-[1.01]'
                  : 'cursor-not-allowed border border-[#fff9ef]/10 bg-[#fff9ef]/[0.04] text-[#fff9ef]/35'
              )}
              type="button"
              disabled={!canSolveCase}
              onClick={() =>
                canSolveCase
                  ? setShowConclusion(true)
                  : setShowSolveLock((v) => !v)
              }
            >
              <Gavel className="size-4" />
              {t('solveCase')}
            </button>
            {!canSolveCase && showSolveLock && (
              <>
                <button
                  type="button"
                  aria-label={t('close')}
                  onClick={() => setShowSolveLock(false)}
                  className="fixed inset-0 z-20 cursor-default"
                />
                <div className="absolute right-0 bottom-full z-30 mb-2 w-72 max-w-[calc(100vw-2.5rem)] origin-bottom-right rounded-2xl border border-[#fff9ef]/12 bg-[#0a0203]/95 p-3 text-xs leading-5 text-[#fff9ef]/65 shadow-2xl backdrop-blur">
                  <div className="flex items-start justify-between gap-2">
                    <p>
                      {t('solveLocked', {
                        found: requiredCluesFound,
                        total: requiredCluesTotal,
                      })}
                    </p>
                    <button
                      type="button"
                      aria-label={t('close')}
                      onClick={() => setShowSolveLock(false)}
                      className="text-gold/70 grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-[#fff9ef]/60 transition hover:text-[#fff9ef]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showEvidence && (
        <EvidenceModal
          clues={clues}
          cluesTotal={cluesTotal}
          requiredCluesFound={requiredCluesFound}
          requiredCluesTotal={requiredCluesTotal}
          questionedCount={questionedCount}
          questionedTotal={characters.length}
          exploredCount={exploredCount}
          exploredTotal={locations.length + objects.length}
          progressPct={progressPct}
          heading={t('evidenceHeading')}
          emptyText={t('evidenceEmpty')}
          closeLabel={t('close')}
          statClues={t('statClues')}
          statPeople={t('statPeople')}
          statPlaces={t('statPlaces')}
          requiredEvidenceLabel={t('requiredEvidence')}
          optionalEvidenceLabel={t('optionalEvidence')}
          progressLabel={t('progress')}
          onClose={() => setShowEvidence(false)}
        />
      )}

      {showCase && (
        <CaseModal
          opening={history.opening}
          objective={history.objective}
          briefingLabel={t('briefing')}
          objectiveLabel={t('objective')}
          closeLabel={t('close')}
          onClose={() => setShowCase(false)}
        />
      )}

      {showConclusion && (
        <ConclusionModal
          fields={conclusionFields}
          title={t('conclusionTitle')}
          subtitle={t('conclusionSubtitle')}
          submitLabel={t('conclusionSubmit')}
          submittingLabel={t('conclusionSubmitting')}
          closeLabel={t('close')}
          errorLabel={t('conclusionError')}
          sessionId={sessionId}
          onClose={() => setShowConclusion(false)}
          onSubmitted={() => {
            setShowConclusion(false);
            router.refresh();
          }}
        />
      )}

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
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
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

function EvidenceModal({
  clues,
  cluesTotal,
  requiredCluesFound,
  requiredCluesTotal,
  questionedCount,
  questionedTotal,
  exploredCount,
  exploredTotal,
  progressPct,
  heading,
  emptyText,
  closeLabel,
  statClues,
  statPeople,
  statPlaces,
  requiredEvidenceLabel,
  optionalEvidenceLabel,
  progressLabel,
  onClose,
}: {
  clues: SessionClue[];
  cluesTotal: number;
  requiredCluesFound: number;
  requiredCluesTotal: number;
  questionedCount: number;
  questionedTotal: number;
  exploredCount: number;
  exploredTotal: number;
  progressPct: number;
  heading: string;
  emptyText: string;
  closeLabel: string;
  statClues: string;
  statPeople: string;
  statPlaces: string;
  requiredEvidenceLabel: string;
  optionalEvidenceLabel: string;
  progressLabel: string;
  onClose: () => void;
}) {
  const requiredClues = clues.filter((clue) => clue.importance === 'required');
  const optionalClues = clues.filter((clue) => clue.importance !== 'required');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        style={{ animation: 'scene-fade-in 0.25s ease forwards' }}
        className="absolute inset-0 cursor-default bg-[#0a0203]/80 backdrop-blur-sm"
      />
      <div
        className="scene-grain relative flex h-[85svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-[#fff9ef]/12 bg-[#1b070b] shadow-2xl sm:rounded-[28px]"
        style={{ animation: 'scene-fade-up 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#fff9ef]/10 px-5 py-4 sm:px-6">
          <h2 className="font-heading inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight sm:text-2xl">
            <KeyRound className="text-gold size-5" />
            {heading}
            {clues.length > 0 && (
              <span className="text-gold/90 bg-gold/10 ring-gold/20 rounded-full px-2 py-0.5 text-sm font-bold ring-1">
                {clues.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-[#fff9ef]/15 bg-black/40 text-[#fff9ef]/80 backdrop-blur transition hover:bg-black/60 hover:text-[#fff9ef]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6">
          {/* progress summary */}
          <div className="flex flex-col gap-3.5 rounded-2xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-gold font-heading text-2xl leading-none font-semibold">
                {progressPct}%
              </span>
              <span className="text-[11px] font-bold tracking-[0.12em] text-[#fff9ef]/40 uppercase">
                {progressLabel}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#fff9ef]/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f] transition-[width] duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-0.5 text-xs text-[#fff9ef]/55">
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="text-gold/70 size-3.5" />
                <span className="font-semibold text-[#fff9ef]">
                  {clues.length}/{cluesTotal}
                </span>{' '}
                {statClues}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gavel className="text-gold/70 size-3.5" />
                <span className="font-semibold text-[#fff9ef]">
                  {requiredCluesFound}/{requiredCluesTotal}
                </span>{' '}
                {requiredEvidenceLabel.toLowerCase()}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="text-gold/70 size-3.5" />
                <span className="font-semibold text-[#fff9ef]">
                  {questionedCount}/{questionedTotal}
                </span>{' '}
                {statPeople}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Compass className="text-gold/70 size-3.5" />
                <span className="font-semibold text-[#fff9ef]">
                  {exploredCount}/{exploredTotal}
                </span>{' '}
                {statPlaces}
              </span>
            </div>
          </div>

          {/* clues list */}
          {clues.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10">
              <Sparkles className="size-8 text-[#fff9ef]/25" />
              <p className="max-w-sm text-center text-sm leading-6 text-[#fff9ef]/45">
                {emptyText}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {requiredClues.length > 0 && (
                <EvidenceSection
                  title={requiredEvidenceLabel}
                  clues={requiredClues}
                  required
                />
              )}
              {optionalClues.length > 0 && (
                <EvidenceSection
                  title={optionalEvidenceLabel}
                  clues={optionalClues}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceSection({
  title,
  clues,
  required = false,
}: {
  title: string;
  clues: SessionClue[];
  required?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold tracking-tight text-[#fff9ef]">
          {title}
        </h3>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-[11px] font-bold ring-1',
            required
              ? 'bg-gold/10 text-gold ring-gold/25'
              : 'bg-[#fff9ef]/[0.04] text-[#fff9ef]/50 ring-[#fff9ef]/10'
          )}
        >
          {clues.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {clues.map((clue) => (
          <article
            key={clue.id}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-4',
              required
                ? 'border-gold/25 bg-gold/[0.06]'
                : 'border-clue-border/30 bg-[#fff4d8]/[0.05]'
            )}
          >
            <div
              className={cn(
                'absolute top-0 left-0 h-full w-1',
                required ? 'bg-gold' : 'bg-[#fff9ef]/30'
              )}
            />
            <h4 className="font-heading pl-2 text-lg font-semibold tracking-tight text-[#fff9ef]">
              {clue.title}
            </h4>
            <p className="mt-1 pl-2 text-sm leading-6 text-[#fff9ef]/65">
              {clue.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CaseModal({
  opening,
  objective,
  briefingLabel,
  objectiveLabel,
  closeLabel,
  onClose,
}: {
  opening: string;
  objective: string;
  briefingLabel: string;
  objectiveLabel: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={briefingLabel}
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        style={{ animation: 'scene-fade-in 0.25s ease forwards' }}
        className="absolute inset-0 cursor-default bg-[#0a0203]/80 backdrop-blur-sm"
      />
      <div
        className="relative flex max-h-[80svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-[#fff9ef]/12 bg-[#1b070b] shadow-2xl sm:rounded-[28px]"
        style={{ animation: 'scene-fade-up 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 grid size-9 cursor-pointer place-items-center rounded-full border border-[#fff9ef]/15 bg-black/40 text-[#fff9ef]/80 backdrop-blur transition hover:bg-black/60 hover:text-[#fff9ef]"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col gap-6 overflow-y-auto p-6 sm:p-8">
          <section>
            <h2 className="text-gold mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase">
              <Sparkles className="size-3.5" />
              {briefingLabel}
            </h2>
            <p className="font-heading text-lg leading-8 text-[#fff9ef]/85 italic sm:text-xl sm:leading-9">
              {opening}
            </p>
          </section>

          <div className="border-gold/25 relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#4a111b]/60 to-[#120406]/30 p-5 sm:p-6">
            <div className="flex items-start gap-3.5">
              <div className="border-gold/40 text-gold grid size-10 shrink-0 place-items-center rounded-xl border bg-black/25">
                <Target className="size-5" />
              </div>
              <div>
                <h3 className="text-gold text-xs font-bold tracking-[0.16em] uppercase">
                  {objectiveLabel}
                </h3>
                <p className="mt-1.5 leading-7 text-[#fff9ef]/90">
                  {objective}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
