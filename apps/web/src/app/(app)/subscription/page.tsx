import { getLocale, getTranslations } from 'next-intl/server';
import { SubscriptionPanel } from '@/components/organisms';
import { EmailVerificationBanner } from '@/components/molecules';
import { getSessionUser } from '@/lib/auth/session';
import {
  fetchSubscriptionSynced,
  fetchSubscriptionPlan,
} from '@/lib/api/subscription-data';

interface SubscriptionPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function SubscriptionPage({
  searchParams,
}: SubscriptionPageProps) {
  const t = await getTranslations('subscription');
  const locale = await getLocale();
  const { status } = await searchParams;

  const [plan, subscription, user] = await Promise.all([
    fetchSubscriptionPlan(),
    fetchSubscriptionSynced(),
    getSessionUser(),
  ]);

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>
      {user && !user.emailVerifiedAt && <EmailVerificationBanner />}
      <SubscriptionPanel
        plan={plan}
        subscription={subscription}
        locale={locale}
        status={status}
        emailVerifiedAt={user?.emailVerifiedAt ?? null}
      />
    </section>
  );
}
