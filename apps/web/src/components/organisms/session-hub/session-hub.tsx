'use client';

import { useId, useMemo, useState } from 'react';
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
import { ConclusionModal } from './conclusion-modal';
import { EndingScreen } from './ending-screen';
import { BoardGroup } from './components/board-group';
import { LeadCard } from './components/lead-card';
import { EvidenceModal } from './components/evidence-modal';
import { CaseModal } from './components/case-modal';
import { TempUserBanner } from '../temp-user-banner/temp-user-banner';

export interface SessionHubProps {
  session: SessionState;
  isTemporaryUser?: boolean;
}

const SESSION_STATUS_SOLVED = 'completed';

export function SessionHub({
  session,
  isTemporaryUser = false,
}: SessionHubProps) {
  const t = useTranslations('play');
  const tGenre = useTranslations('common.genres');
  const router = useRouter();
  const {
    id: sessionId,
    story,
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
  const [assistedMode, setAssistedMode] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showCase, setShowCase] = useState(false);
  const [showConclusion, setShowConclusion] = useState(false);
  const [showSolveLockedHint, setShowSolveLockedHint] = useState(false);
  const solveLockedHintId = useId();

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
  const solveLockedMessage = t('solveLocked', {
    found: requiredCluesFound,
    total: requiredCluesTotal,
  });

  const handleSolveCaseClick = () => {
    if (canSolveCase) {
      setShowSolveLockedHint(false);
      setShowConclusion(true);
      return;
    }

    setShowSolveLockedHint(true);
  };

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
          {story.coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={story.coverImageUrl}
              alt={story.title}
              className="absolute inset-0 h-full w-full scale-105 object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120406] via-[#120406]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#120406]/80 via-transparent to-transparent" />

          <button
            type="button"
            onClick={() => setAssistedMode((v) => !v)}
            aria-pressed={assistedMode}
            aria-label={t('assistedMode')}
            title={t('assistedMode')}
            className={cn(
              'absolute top-4 right-4 z-10 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide backdrop-blur transition',
              assistedMode
                ? 'border-gold/50 bg-gold/20 text-gold'
                : 'border-[#fff9ef]/15 bg-black/30 text-[#fff9ef]/60 hover:text-[#fff9ef]'
            )}
          >
            <Sparkles className="size-3.5" />
            {t('assistedMode')}
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
                {tGenre(story.genre)}
              </span>
            </div>

            <h1 className="font-heading max-w-2xl text-4xl leading-[0.98] font-semibold tracking-tight text-[#fff9ef] drop-shadow-sm sm:text-6xl">
              {story.title}
            </h1>
            {story.subtitle && (
              <p className="max-w-xl text-sm leading-relaxed text-[#fff9ef]/70 sm:text-base">
                {story.subtitle}
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
          {story.opening}
        </span>
        <span className="text-gold shrink-0 text-xs font-bold tracking-wide uppercase">
          {t('reviewCase')}
        </span>
      </button>

      {isTemporaryUser && <TempUserBanner dismissible={false} />}

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
                      : assistedMode
                        ? t('cluesHereAssisted', {
                            found: effectiveCluesFound,
                            total: effectiveCluesTotal,
                          })
                        : t('cluesHere', {
                            count: effectiveCluesFound,
                          })
                  }
                  assistedMode={assistedMode}
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
                    : assistedMode
                      ? t('cluesHereAssisted', {
                          found: character.discoveredClues.length,
                          total: character.cluesTotal,
                        })
                      : t('cluesHere', {
                          count: character.discoveredClues.length,
                        })
                }
                assistedMode={assistedMode}
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
      <div className="h-[calc(6rem+env(safe-area-inset-bottom))]" />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#fff9ef]/10 bg-[#1b070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:px-6">
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
            className="inline-flex min-h-12 flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl border border-[#fff9ef]/15 px-4 py-2.5 text-sm font-bold text-[#fff9ef]/85 transition hover:bg-[#fff9ef]/[0.06] sm:flex-none"
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
          <div className="group/solve relative flex flex-1 sm:flex-none">
            <button
              className={cn(
                'inline-flex min-h-12 flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none',
                canSolveCase
                  ? 'shadow-button text-gold-foreground cursor-pointer bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] hover:scale-[1.01]'
                  : 'cursor-pointer border border-[#fff9ef]/10 bg-[#fff9ef]/[0.04] text-[#fff9ef]/35 hover:bg-[#fff9ef]/[0.07]'
              )}
              type="button"
              aria-disabled={!canSolveCase}
              aria-describedby={!canSolveCase ? solveLockedHintId : undefined}
              onBlur={() => setShowSolveLockedHint(false)}
              onClick={handleSolveCaseClick}
              onFocus={() => !canSolveCase && setShowSolveLockedHint(true)}
            >
              <Gavel className="size-4" />
              {t('solveCase')}
            </button>
            {!canSolveCase && (
              <div
                id={solveLockedHintId}
                className={cn(
                  'pointer-events-none absolute right-0 bottom-full z-20 mb-2 w-72 rounded-2xl border border-[#fff9ef]/12 bg-[#0a0203]/95 p-3 text-xs leading-5 text-[#fff9ef]/65 shadow-2xl backdrop-blur transition-all group-focus-within/solve:translate-y-0 group-focus-within/solve:opacity-100 group-hover/solve:translate-y-0 group-hover/solve:opacity-100',
                  showSolveLockedHint
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-1 opacity-0'
                )}
              >
                {solveLockedMessage}
              </div>
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
          opening={story.opening}
          objective={story.objective}
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
        assistedMode={assistedMode}
        onSelectObject={(object) =>
          setTargetRef({ kind: 'object', id: object.id })
        }
        onInteracted={handleInteracted}
        onClose={() => setTargetRef(null)}
      />
    </div>
  );
}

export type { SessionCharacter, SessionLocation, SessionObject };
