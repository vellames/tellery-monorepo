'use client';

import { Loader2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ObjectInspectActionProps {
  isSending: boolean;
  onInspect: () => void;
}

export function ObjectInspectAction({
  isSending,
  onInspect,
}: ObjectInspectActionProps) {
  const tp = useTranslations('play.panel');

  return (
    <div className="shrink-0 border-t border-[#fff9ef]/10 bg-[#150508] p-3 sm:p-4">
      <button
        type="button"
        onClick={onInspect}
        disabled={isSending}
        className="text-gold-foreground shadow-button flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-4 text-base font-bold transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
      >
        {isSending ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            {tp('sending')}
          </>
        ) : (
          <>
            <Search className="size-5" />
            {tp('inspect')}
          </>
        )}
      </button>
    </div>
  );
}
