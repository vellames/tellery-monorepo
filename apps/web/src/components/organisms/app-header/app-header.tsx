import Image from 'next/image';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { User } from '@/lib/types/auth';

const AVAILABLE_SESSIONS = 20;

export interface AppHeaderProps {
  user: User;
}

export function AppHeader({ user }: AppHeaderProps) {
  const t = useTranslations('common');

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Tellery"
          width={178}
          height={72}
          priority
          className="h-auto w-36 sm:w-44"
        />
        <div className="border-border hidden border-l pl-3 sm:block">
          <p className="text-muted-foreground max-w-40 text-base leading-snug">
            {t('tagline')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="border-border bg-card/70 text-muted-foreground shadow-soft hidden items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold sm:flex">
          <Star className="fill-gold text-gold size-4" />
          <span>{t('sessionsAvailable', { count: AVAILABLE_SESSIONS })}</span>
        </div>
        <div className="bg-secondary text-secondary-foreground shadow-soft grid size-12 place-items-center overflow-hidden rounded-full text-sm font-semibold sm:size-14">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
