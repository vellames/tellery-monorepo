import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type User, isTemporaryUser } from '@/lib/types/auth';
import { CreditsAvailableBadge } from '@/components/molecules';
import { UserMenu } from '@/components/organisms/user-menu/user-menu';
import { config } from '@/lib/config';

export interface AppHeaderProps {
  user: User;
  hasActiveSubscription?: boolean;
}

export function AppHeader({ user, hasActiveSubscription }: AppHeaderProps) {
  const t = useTranslations('common');
  const tSub = useTranslations('subscription');

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
        <CreditsAvailableBadge
          className="px-3 py-2 sm:px-5 sm:py-3"
          hasActiveSubscription={hasActiveSubscription}
        />
        {!hasActiveSubscription && !isTemporaryUser(user) && (
          <Link
            href={config.routes.subscription}
            className="bg-primary text-primary-foreground shadow-soft hover:bg-primary/80 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            <Sparkles className="size-4" />
            <span>{tSub('subscribeNow')}</span>
          </Link>
        )}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
