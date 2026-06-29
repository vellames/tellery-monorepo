'use client';

import { CheckCircle2, KeyRound, Sparkles } from 'lucide-react';
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

      <div className="scene-clue-card relative z-10 w-full max-w-lg overflow-hidden rounded-[30px] border border-[#f4d78f]/25 bg-[#160508]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.62),0_0_80px_rgba(196,154,74,0.18)] ring-1 ring-white/[0.04] backdrop-blur-2xl sm:p-6">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f9e8b7]/90 to-transparent" />
        <div className="pointer-events-none absolute -top-28 right-6 h-56 w-56 rounded-full bg-[#f4d78f]/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-[#7b1f2a]/18 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="scene-clue-seal grid size-14 shrink-0 place-items-center rounded-2xl border border-[#f4d78f]/35 bg-gradient-to-br from-[#fff0c7] via-[#f4d78f] to-[#b77d32] text-[#32160a] shadow-[0_16px_44px_rgba(196,154,74,0.32)] ring-1 ring-white/30">
            <KeyRound className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="text-gold flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="size-3.5" />
              {heading}
            </div>
            <div className="mt-2 h-px w-28 bg-gradient-to-r from-[#f4d78f]/80 to-transparent" />
          </div>
        </div>

        <div className="relative mt-5 max-h-[48svh] [scrollbar-gutter:stable] overflow-y-auto overscroll-contain rounded-[24px] pr-1">
          <div className="flex flex-col gap-3 px-1 py-2">
            {clues.map((clue, i) => (
              <div
                key={clue.id}
                className="scene-clue-item group relative overflow-hidden rounded-[22px] border border-[#f4d78f]/18 bg-gradient-to-br from-[#fff9ef]/[0.085] via-[#fff9ef]/[0.045] to-[#f4d78f]/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_34px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:border-[#f4d78f]/38 hover:bg-[#fff9ef]/[0.08]"
                style={{ animationDelay: `${0.18 + i * 0.12}s` }}
              >
                <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#f9e8b7]/55 to-transparent" />
                <div className="pointer-events-none absolute -right-10 -bottom-12 size-28 rounded-full bg-[#f4d78f]/8 blur-2xl transition group-hover:bg-[#f4d78f]/12" />
                <div className="relative flex gap-3.5">
                  <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-[#f4d78f]/28 bg-[#0a0203]/45 text-[11px] font-black text-[#f9e8b7] shadow-inner">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading text-xl leading-tight font-semibold tracking-tight text-[#fff9ef]">
                        {clue.title}
                      </h3>
                      <CheckCircle2 className="text-gold/85 mt-1 size-4 shrink-0" />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#fff9ef]/70">
                      {clue.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="text-gold-foreground mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f4d78f] via-[#f9e8b7] to-[#fff0c7] px-8 py-3.5 text-sm font-black tracking-wide shadow-[0_18px_42px_rgba(196,154,74,0.24)] transition hover:scale-[1.01] hover:shadow-[0_20px_48px_rgba(196,154,74,0.32)]"
        >
          {continueLabel}
          <Sparkles className="size-4" />
        </button>
      </div>
    </div>
  );
}
