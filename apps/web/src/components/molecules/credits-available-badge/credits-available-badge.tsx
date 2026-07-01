'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAvailableCredits } from '@/lib/hooks/use-available-credits';

export interface CreditsAvailableBadgeProps {
  className?: string;
}

export function CreditsAvailableBadge({
  className,
}: CreditsAvailableBadgeProps) {
  const t = useTranslations('common');
  const { data: count, isLoading } = useAvailableCredits();

  return (
    <div
      className={cn(
        'border-border bg-card/70 text-muted-foreground shadow-soft flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold',
        className
      )}
    >
      <Star className="fill-gold text-gold size-4" />
      <span>
        {isLoading
          ? t('creditsAvailable', { count: '…' })
          : t('creditsAvailable', { count: count ?? 0 })}
      </span>
    </div>
  );
}
