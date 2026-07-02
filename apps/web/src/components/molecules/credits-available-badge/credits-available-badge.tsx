'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';
import { useAvailableCredits } from '@/lib/hooks/use-available-credits';

export interface CreditsAvailableBadgeProps {
  className?: string;
  hasActiveSubscription?: boolean;
}

export function CreditsAvailableBadge({
  className,
  hasActiveSubscription = false,
}: CreditsAvailableBadgeProps) {
  const tCommon = useTranslations('common');
  const tSub = useTranslations('subscription');
  const [open, setOpen] = useState(false);
  const { data: count, isLoading } = useAvailableCredits();

  const displayCount = isLoading ? '…' : (count ?? 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tCommon('creditsAvailable', { count: displayCount })}
        className={cn(
          'border-border bg-card/70 text-muted-foreground shadow-soft hover:bg-muted flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition',
          className
        )}
      >
        <Star className="fill-gold text-gold size-4" />
        {/* Mobile: number only */}
        <span className="sm:hidden">{displayCount}</span>
        {/* Desktop: full label */}
        <span className="hidden sm:inline">
          {tCommon('creditsAvailable', { count: displayCount })}
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={tCommon('close')}
      >
        <div className="flex flex-col gap-4 p-7">
          <h2 className="font-heading text-xl font-bold">
            {tCommon('yourCredits')}
          </h2>
          <div className="border-border bg-card/70 flex items-center gap-3 rounded-2xl border p-4">
            <Star className="fill-gold text-gold size-6" />
            <span className="text-foreground text-2xl font-bold">
              {displayCount}
            </span>
          </div>
          <p className="text-muted-foreground">
            {tCommon('youHaveCredits', { count: displayCount })}
          </p>
          {!hasActiveSubscription && (
            <Link
              href={config.routes.subscription}
              onClick={() => setOpen(false)}
              className="bg-primary text-primary-foreground shadow-soft hover:bg-primary/80 mt-2 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition"
            >
              <Sparkles className="size-4" />
              {tSub('subscribeForMoreCredits')}
            </Link>
          )}
        </div>
      </Modal>
    </>
  );
}
