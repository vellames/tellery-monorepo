import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSessionUser } from '@/lib/auth/session';
import { isTemporaryUser } from '@/lib/types/auth';
import { config } from '@/lib/config';
import { LinkAccountForm } from '@/components/organisms';

export default async function LinkAccountPage() {
  const t = await getTranslations('convertAccount');

  const user = await getSessionUser();

  // Only temporary users can link an account. Permanent users already have
  // one, and logged-out visitors have nothing to link (they'd just register).
  if (user && !isTemporaryUser(user)) {
    redirect(config.routes.home);
  }
  if (!user) {
    redirect(config.routes.register);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-primary text-2xl font-bold tracking-tight">
          {t('page.title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('page.subtitle')}</p>
      </div>
      <LinkAccountForm />
    </div>
  );
}
