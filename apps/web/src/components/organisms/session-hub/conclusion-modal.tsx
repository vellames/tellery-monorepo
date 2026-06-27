'use client';

import { useState } from 'react';
import { CheckCircle2, Gavel, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConclusionField, ConclusionResult } from '@/lib/types/session';

export interface ConclusionModalProps {
  fields: ConclusionField[];
  title: string;
  subtitle: string;
  submitLabel: string;
  submittingLabel: string;
  closeLabel: string;
  errorLabel: string;
  sessionId: string;
  onClose: () => void;
  onSubmitted: (result: ConclusionResult) => void;
}

export function ConclusionModal({
  fields,
  title,
  subtitle,
  submitLabel,
  submittingLabel,
  closeLabel,
  errorLabel,
  sessionId,
  onClose,
  onSubmitted,
}: ConclusionModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = fields.every((f) => answers[f.id]);

  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/session/${sessionId}/conclusion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: fields.map((f) => ({
            fieldId: f.id,
            optionId: answers[f.id],
          })),
        }),
      });

      const body = (await res.json().catch(() => null)) as
        | (ConclusionResult & { error?: string })
        | null;

      if (!res.ok || !body || body.error) {
        throw new Error(body?.error ?? errorLabel);
      }

      onSubmitted(body);
    } catch {
      setError(errorLabel);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        style={{ animation: 'scene-fade-in 0.25s ease forwards' }}
        className="absolute inset-0 cursor-default bg-[#0a0203]/80 backdrop-blur-sm"
      />

      <div
        className="scene-grain relative flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-[#fff9ef]/12 bg-[#1b070b] shadow-2xl sm:rounded-[28px]"
        style={{ animation: 'scene-fade-up 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#fff9ef]/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#f4d78f] to-[#c49a4a] shadow-lg">
              <Gavel className="size-5 text-[#1b070b]" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight text-[#fff9ef]">
                {title}
              </h2>
              <p className="text-xs text-[#fff9ef]/50">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="grid size-9 cursor-pointer place-items-center rounded-full border border-[#fff9ef]/15 bg-black/40 text-[#fff9ef]/80 backdrop-blur transition hover:bg-black/60 hover:text-[#fff9ef]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2.5">
              <label className="font-heading block text-base font-semibold text-[#fff9ef]">
                {field.label}
              </label>
              <div className="grid gap-2">
                {field.options.map((option) => {
                  const selected = answers[field.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [field.id]: option.id,
                        }))
                      }
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition',
                        selected
                          ? 'border-gold/50 bg-gold/10 text-[#fff9ef]'
                          : 'border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] text-[#fff9ef]/70 hover:border-[#fff9ef]/25 hover:bg-[#fff9ef]/[0.06]'
                      )}
                    >
                      <span>{option.label}</span>
                      {selected && (
                        <CheckCircle2 className="text-gold size-4 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {error && (
            <p className="text-center text-sm text-[#e57373]">{error}</p>
          )}
        </div>

        {/* footer */}
        <div className="shrink-0 border-t border-[#fff9ef]/10 bg-[#150508] p-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition',
              allAnswered && !isSubmitting
                ? 'text-gold-foreground shadow-button cursor-pointer bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] hover:scale-[1.01]'
                : 'cursor-not-allowed bg-[#fff9ef]/[0.04] text-[#fff9ef]/30'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {submittingLabel}
              </>
            ) : (
              <>
                <Gavel className="size-4" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
