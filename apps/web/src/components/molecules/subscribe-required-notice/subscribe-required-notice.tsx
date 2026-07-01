import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { config } from '@/lib/config';

export function SubscribeRequiredNotice() {
  const t = useTranslations('stories');

  return (
    <div className="flex flex-col gap-3">
      <div className="border-gold/20 bg-clue/40 flex items-start gap-3 rounded-2xl border p-4">
        <Lock className="text-gold mt-0.5 size-5 shrink-0" />
        <p className="text-foreground/70 text-sm leading-6">
          {t('premiumRequiredMessage')}
        </p>
      </div>
      <Link
        href={config.routes.subscription}
        className="shadow-button mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground transition hover:scale-[1.01]"
      >
        <Sparkles className="size-5" />
        {t('subscribeToPlay')}
      </Link>
      <button
        type="button"
        disabled
        className="shadow-button inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-5 text-base font-bold text-[#4a111b] opacity-70"
      >
        <Lock className="size-5" />
        {t('startButton')}
      </button>
    </div>
  );
}
