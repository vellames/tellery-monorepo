import { useTranslations } from 'next-intl';
import type { User } from '@/lib/types/auth';
import { CreditsAvailableBadge } from '@/components/molecules';

export interface AppHeaderProps {
  user: User;
}

export function AppHeader({ user }: AppHeaderProps) {
  const t = useTranslations('common');

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Tellery"
          width={178}
          height={72}
          className="h-auto w-36 sm:w-44"
        />
        <div className="border-border hidden border-l pl-3 sm:block">
          <p className="text-muted-foreground max-w-40 text-base leading-snug">
            {t('tagline')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <CreditsAvailableBadge className="px-3 py-2 sm:px-5 sm:py-3" />
        <div className="bg-secondary text-secondary-foreground shadow-soft grid size-12 place-items-center overflow-hidden rounded-full text-sm font-semibold sm:size-14">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
