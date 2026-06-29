'use client';

import { Loader2, Mic, Send, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface CharacterInteractionFormProps {
  value: string;
  onChange: (value: string) => void;
  isSending: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  name: string;
  onSubmit: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function CharacterInteractionForm({
  value,
  onChange,
  isSending,
  isRecording,
  isTranscribing,
  name,
  onSubmit,
  onStartRecording,
  onStopRecording,
}: CharacterInteractionFormProps) {
  const tp = useTranslations('play.panel');

  return (
    <div className="shrink-0 border-t border-[#fff9ef]/10 bg-[#150508] p-3 sm:p-4">
      <form
        className="flex items-center gap-2 rounded-2xl border border-[#fff9ef]/12 bg-[#fff9ef]/[0.04] px-3 py-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isSending || isRecording}
          placeholder={
            isRecording ? tp('recording') : tp('askPlaceholder', { name })
          }
          className="flex-1 bg-transparent py-2 text-sm text-[#fff9ef] placeholder:text-[#fff9ef]/40 focus:outline-none disabled:opacity-50"
        />
        {isRecording ? (
          <button
            type="button"
            onClick={onStopRecording}
            aria-label={tp('recording')}
            className="grid size-9 shrink-0 animate-pulse cursor-pointer place-items-center rounded-xl bg-[#e57373]/20 text-[#e57373] ring-1 ring-[#e57373]/30 transition"
          >
            <Square className="size-4" />
          </button>
        ) : isTranscribing ? (
          <div className="text-gold/70 grid size-9 shrink-0 place-items-center rounded-xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.04]">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartRecording}
            disabled={isSending}
            aria-label={tp('tapToRecord')}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.04] text-[#fff9ef]/60 transition hover:text-[#fff9ef] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mic className="size-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={isSending || isRecording || !value.trim()}
          aria-label={tp('send')}
          className="text-gold-foreground grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
