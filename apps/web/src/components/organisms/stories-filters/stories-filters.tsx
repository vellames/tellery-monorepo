'use client';

import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TogglePill } from '@/components/ui/toggle-pill';

type ActiveFilter = 'free' | 'premium' | null;

function resolveActiveFilter(param: string | null): ActiveFilter {
  if (param === 'true') return 'free';
  if (param === 'false') return 'premium';
  return null;
}

export function StoriesFilters() {
  const t = useTranslations('stories.filters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilter = resolveActiveFilter(searchParams.get('isFree'));
  const freeOn = activeFilter !== 'premium';
  const premiumOn = activeFilter !== 'free';

  const apply = (next: ActiveFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === null) params.delete('isFree');
    else params.set('isFree', next === 'free' ? 'true' : 'false');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const toggleFree = () => apply(activeFilter === 'free' ? null : 'free');

  const togglePremium = () =>
    apply(activeFilter === 'premium' ? null : 'premium');

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="flex flex-wrap items-center gap-2"
    >
      <TogglePill tone="free" pressed={freeOn} onClick={toggleFree}>
        {t('free')}
      </TogglePill>
      <TogglePill tone="premium" pressed={premiumOn} onClick={togglePremium}>
        {premiumOn && <Lock className="size-3.5" />}
        {t('premium')}
      </TogglePill>
    </div>
  );
}
