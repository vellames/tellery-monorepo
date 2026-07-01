'use client';

import { Loader2, MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useResendVerification } from '@/lib/hooks/use-auth';

export function EmailVerificationBanner() {
  const t = useTranslations('verifyEmail');
  const resend = useResendVerification();

  return (
    <div className="border-gold/20 bg-clue/40 flex items-center justify-between gap-3 rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <MailCheck className="text-gold mt-0.5 size-5 shrink-0" />
        <p className="text-foreground/70 text-sm leading-6">
          {t('bannerMessage')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => resend.mutate()}
        disabled={resend.isPending}
        className="text-primary shrink-0 text-sm font-semibold underline disabled:opacity-50"
      >
        {resend.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          t('resend')
        )}
      </button>
    </div>
  );
}
