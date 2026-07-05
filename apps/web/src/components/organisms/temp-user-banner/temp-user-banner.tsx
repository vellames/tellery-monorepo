'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { config } from '@/lib/config';

interface TempUserBannerProps {
  /**
   * When true, the banner can be dismissed with a "not now" link. On the ad
   * landing page the whole point is to nudge conversion, so it stays put.
   */
  dismissible?: boolean;
}

/**
 * Non-intrusive banner shown to temporary users, nudging them to create a
 * permanent account. The actual conversion form lives on a dedicated page
 * (/link-account) so the banner stays compact and never blocks the experience.
 */
export function TempUserBanner({ dismissible = true }: TempUserBannerProps) {
  const t = useTranslations('convertAccount');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="border-gold/30 bg-clue/60 flex items-start justify-between gap-4 rounded-3xl border p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-gold-foreground text-lg font-semibold tracking-tight">
          {t('title')}
        </h2>
        <p className="text-foreground/70 text-sm leading-6">
          {t('description')}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Link
          href={config.routes.linkAccount}
          className="shadow-button inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-6 py-3 text-sm font-bold text-[#4a111b] transition hover:scale-[1.01]"
        >
          {t('cta')}
        </Link>
        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground text-xs underline transition"
          >
            {t('notNow')}
          </button>
        )}
      </div>
    </div>
  );
}
