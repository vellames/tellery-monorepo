'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface StartSessionButtonProps {
  pending: boolean;
}

export function StartSessionButton({ pending }: StartSessionButtonProps) {
  const t = useTranslations('stories');

  return (
    <button
      className="shadow-button mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-5 text-base font-bold text-[#4a111b] transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          {t('starting')}
        </>
      ) : (
        <>
          {t('startButton')}
          <ArrowRight className="size-5" />
        </>
      )}
    </button>
  );
}
