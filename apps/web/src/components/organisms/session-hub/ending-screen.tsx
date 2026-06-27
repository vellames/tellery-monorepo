'use client';

import Link from 'next/link';
import {
  Award,
  BookOpen,
  Clapperboard,
  Home,
  KeyRound,
  Sparkles,
  Target,
} from 'lucide-react';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { SessionEndingState } from '@/lib/types/session';

export interface EndingScreenProps {
  ending: SessionEndingState;
  playAgainLabel: string;
  summaryLabel: string;
  epilogueLabel: string;
  scoreLabel: string;
  correctAnswersLabel: string;
  cluesDiscoveredLabel: string;
  requiredCluesLabel: string;
  endingTypeLabels: Record<string, string>;
}

const ENDING_STYLES: Record<
  string,
  { ring: string; badge: string; glow: string }
> = {
  full_truth: {
    ring: 'ring-gold/30',
    badge: 'bg-gold/15 text-gold ring-gold/25',
    glow: 'from-[#f4d78f]/20',
  },
  partial_truth: {
    ring: 'ring-[#c49a4a]/25',
    badge: 'bg-[#c49a4a]/15 text-[#e8c87f] ring-[#c49a4a]/25',
    glow: 'from-[#c49a4a]/10',
  },
  wrong_accusation: {
    ring: 'ring-[#e57373]/20',
    badge: 'bg-[#e57373]/10 text-[#e57373] ring-[#e57373]/20',
    glow: 'from-[#e57373]/5',
  },
};

export function EndingScreen({
  ending,
  playAgainLabel,
  summaryLabel,
  epilogueLabel,
  scoreLabel,
  correctAnswersLabel,
  cluesDiscoveredLabel,
  requiredCluesLabel,
  endingTypeLabels,
}: EndingScreenProps) {
  const { snapshot, score } = ending;
  const style = ENDING_STYLES[snapshot.type] ?? ENDING_STYLES.wrong_accusation;

  return (
    <div className="flex flex-col gap-8 pb-16">
      <Link
        className="group inline-flex items-center gap-2 self-start text-sm font-semibold text-[#fff9ef]/55 transition hover:text-[#fff9ef]"
        href={config.routes.stories}
      >
        <Home className="size-4 transition group-hover:-translate-x-0.5" />
        {playAgainLabel}
      </Link>

      {/* hero */}
      <header
        className={cn(
          'scene-grain relative overflow-hidden rounded-[28px] border border-[#fff9ef]/10 sm:rounded-[36px]'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br to-transparent',
            style.glow
          )}
        />
        <div className="relative min-h-[300px] sm:min-h-[380px]">
          {snapshot.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={snapshot.imageUrl}
              alt={snapshot.title}
              className="absolute inset-0 h-full w-full object-cover brightness-[0.55]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120406] via-[#120406]/40 to-transparent" />

          <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8">
            <span
              className={cn(
                'mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase ring-1 backdrop-blur',
                style.badge
              )}
            >
              <Clapperboard className="size-3.5" />
              {endingTypeLabels[snapshot.type] ?? snapshot.type}
            </span>
            <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight text-[#fff9ef] sm:text-4xl">
              {snapshot.title}
            </h1>
          </div>
        </div>
      </header>

      {/* summary + epilogue */}
      <div className="mx-auto grid w-full max-w-2xl gap-5">
        <section className="rounded-2xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] p-5">
          <h2 className="font-heading mb-2 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#fff9ef]/50 uppercase">
            <BookOpen className="size-4" />
            {summaryLabel}
          </h2>
          <p className="leading-7 text-[#fff9ef]/80">{snapshot.summary}</p>
        </section>

        <section className="rounded-2xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] p-5">
          <h2 className="font-heading mb-2 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#fff9ef]/50 uppercase">
            <Sparkles className="size-4" />
            {epilogueLabel}
          </h2>
          <p className="leading-7 text-[#fff9ef]/70 italic">
            {snapshot.epilogue}
          </p>
        </section>

        {/* score */}
        <section className="rounded-2xl border border-[#fff9ef]/10 bg-gradient-to-br from-[#fff9ef]/[0.04] to-transparent p-5">
          <h2 className="font-heading mb-4 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#fff9ef]/50 uppercase">
            <Award className="size-4" />
            {scoreLabel}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <ScoreCard
              icon={Target}
              label={correctAnswersLabel}
              value={score.correctAnswers}
              total={score.totalAnswers}
            />
            <ScoreCard
              icon={KeyRound}
              label={cluesDiscoveredLabel}
              value={score.discoveredClues}
              total={score.totalClues}
            />
            <ScoreCard
              icon={Sparkles}
              label={requiredCluesLabel}
              value={score.requiredCluesDiscovered}
              total={score.totalRequiredClues}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ScoreCard({
  icon: Icon,
  label,
  value,
  total,
}: {
  icon: typeof Award;
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#fff9ef]/8 bg-[#0a0203]/40 p-4">
      <div className="text-gold/70 mb-2 flex items-center gap-1.5">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-bold text-[#fff9ef]">
          {value}
        </span>
        <span className="text-sm text-[#fff9ef]/40">/{total}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#fff9ef]/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
