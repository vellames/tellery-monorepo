'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { useAvailableCredits } from '@/lib/hooks/use-available-credits';

export interface CreditsAvailableBadgeProps {
  className?: string;
}

export function CreditsAvailableBadge({
  className,
}: CreditsAvailableBadgeProps) {
  const tCommon = useTranslations('common');
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
        </div>
      </Modal>
    </>
  );
}
