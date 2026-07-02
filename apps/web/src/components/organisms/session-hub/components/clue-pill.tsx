'use client';

import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import type { SessionClue } from '@/lib/types/session';

export interface CluePillProps {
  found: number;
  total: number;
  assistedMode: boolean;
  clues: SessionClue[];
  label: string;
  emptyLabel: string;
  closeLabel: string;
}

export function CluePill({
  found,
  total,
  assistedMode,
  clues,
  label,
  emptyLabel,
  closeLabel,
}: CluePillProps) {
  const pct = total > 0 ? Math.round((found / total) * 100) : 0;
  const hasClues = clues.length > 0;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-[#fff9ef]/15 bg-black/40 px-3 py-1.5 backdrop-blur transition hover:border-[#fff9ef]/25"
      >
        <KeyRound className="text-gold size-3.5" />
        {assistedMode ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#fff9ef]/80">
              {found}/{total}
            </span>
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#fff9ef]/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-[11px] font-bold text-[#fff9ef]/80">
            {found}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute top-full right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2.5rem)] origin-top-right">
            <div className="flex flex-col gap-2 rounded-2xl border border-[#fff9ef]/12 bg-[#0a0203]/95 p-3 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <span className="text-gold text-[10px] font-bold tracking-[0.12em] uppercase">
                  {label}
                </span>
                <button
                  type="button"
                  aria-label={closeLabel}
                  onClick={() => setOpen(false)}
                  className="text-gold/70 grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-[#fff9ef]/60 transition hover:text-[#fff9ef]"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              {hasClues ? (
                clues.map((clue) => (
                  <div
                    key={clue.id}
                    className="border-clue-border/20 relative overflow-hidden rounded-lg border bg-[#fff4d8]/[0.05] p-2.5 pl-3.5"
                  >
                    <div className="bg-gold absolute top-0 left-0 h-full w-1" />
                    <h4 className="text-sm font-semibold text-[#fff9ef]">
                      {clue.title}
                    </h4>
                    <p className="mt-0.5 text-xs leading-5 text-[#fff9ef]/60">
                      {clue.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-5 text-[#fff9ef]/50">
                  {emptyLabel}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
