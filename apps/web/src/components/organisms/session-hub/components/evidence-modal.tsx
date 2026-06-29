'use client';

import { Compass, Gavel, KeyRound, Sparkles, Users, X } from 'lucide-react';
import type { SessionClue } from '@/lib/types/session';
import { EvidenceSection } from './evidence-section';

export interface EvidenceModalProps {
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
}

export function EvidenceModal({
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
}: EvidenceModalProps) {
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
