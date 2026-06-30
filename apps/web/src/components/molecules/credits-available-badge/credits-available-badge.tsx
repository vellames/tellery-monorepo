import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface CreditsAvailableBadgeProps {
  count: number;
  className?: string;
}

export function CreditsAvailableBadge({
  count,
  className,
}: CreditsAvailableBadgeProps) {
  const t = useTranslations('common');

  return (
    <div
      className={cn(
        'border-border bg-card/70 text-muted-foreground shadow-soft flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold',
        className
      )}
    >
      <Star className="fill-gold text-gold size-4" />
      <span>{t('creditsAvailable', { count })}</span>
    </div>
  );
}
