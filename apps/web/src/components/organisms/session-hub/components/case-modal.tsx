'use client';

import { Sparkles, Target, X } from 'lucide-react';

export interface CaseModalProps {
  opening: string;
  objective: string;
  briefingLabel: string;
  objectiveLabel: string;
  closeLabel: string;
  onClose: () => void;
}

export function CaseModal({
  opening,
  objective,
  briefingLabel,
  objectiveLabel,
  closeLabel,
  onClose,
}: CaseModalProps) {
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
