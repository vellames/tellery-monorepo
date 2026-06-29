'use client';

import { KeyRound, Sparkles } from 'lucide-react';
import type { InteractDiscoveredClue } from '@/lib/types/session';

export interface ClueDiscoveryOverlayProps {
  clues: InteractDiscoveredClue[];
  heading: string;
  continueLabel: string;
  onContinue: () => void;
}

export function ClueDiscoveryOverlay({
  clues,
  heading,
  continueLabel,
  onContinue,
}: ClueDiscoveryOverlayProps) {
  return (
    <div className="absolute inset-0 isolate z-30 flex items-center justify-center overflow-hidden bg-[#0a0203]/88 p-4 backdrop-blur-xl sm:p-6">
      <div className="scene-clue-aura pointer-events-none absolute inset-0" />
      <div className="scene-clue-flash pointer-events-none absolute inset-0" />
      <div className="scene-clue-sweep pointer-events-none absolute" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="scene-clue-particle" />
        ))}
      </div>

      <div className="scene-clue-card relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-[#f4d78f]/25 bg-[#160508]/92 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.58),0_0_70px_rgba(196,154,74,0.16)] backdrop-blur-2xl sm:p-6">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f9e8b7]/80 to-transparent" />
        <div className="pointer-events-none absolute -top-24 right-8 h-48 w-48 rounded-full bg-[#f4d78f]/10 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="scene-clue-seal grid size-14 shrink-0 place-items-center rounded-2xl border border-[#f4d78f]/30 bg-gradient-to-br from-[#f9e8b7] to-[#c49a4a] text-[#32160a] shadow-[0_14px_40px_rgba(196,154,74,0.28)]">
            <KeyRound className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="text-gold flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase">
              <Sparkles className="size-3.5" />
              {heading}
            </div>
            <div className="mt-2 h-px w-24 bg-gradient-to-r from-[#f4d78f]/70 to-transparent" />
          </div>
        </div>

        <div className="relative mt-5 flex max-h-[42svh] flex-col gap-3 overflow-y-auto pr-1">
          {clues.map((clue, i) => (
            <div
              key={clue.id}
              className="scene-clue-item group relative overflow-hidden rounded-2xl border border-[#fff9ef]/12 bg-[#fff9ef]/[0.055] p-4 transition hover:border-[#f4d78f]/35 hover:bg-[#fff9ef]/[0.075]"
              style={{ animationDelay: `${0.18 + i * 0.12}s` }}
            >
              <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#f9e8b7] via-[#f4d78f] to-[#9a6b2f]" />
              <h3 className="font-heading text-xl leading-tight font-semibold text-[#fff9ef]">
                {clue.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#fff9ef]/68">
                {clue.description}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="text-gold-foreground mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-3.5 text-sm font-bold shadow-[0_16px_36px_rgba(196,154,74,0.22)] transition hover:scale-[1.01] hover:shadow-[0_18px_42px_rgba(196,154,74,0.3)]"
        >
          {continueLabel}
          <Sparkles className="size-4" />
        </button>
      </div>
    </div>
  );
}
