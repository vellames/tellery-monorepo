import { getLocale, getTranslations } from 'next-intl/server';
import {
  ProfileForm,
  ChangePasswordForm,
  SubscriptionPanel,
} from '@/components/organisms';
import {
  CreditsAvailableBadge,
  EmailVerificationBanner,
} from '@/components/molecules';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchMe } from '@/lib/api/me';
import {
  fetchSubscriptionSynced,
  fetchSubscriptionPlan,
} from '@/lib/api/subscription-data';
import { isActiveSubscription } from '@/lib/types/subscription';

export default async function ProfilePage() {
  const user = await fetchMe();
  const t = await getTranslations('profile');
  const locale = await getLocale();
  const memberSince = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(user.createdAt));

  const [plan, subscription] = await Promise.all([
    fetchSubscriptionPlan(),
    fetchSubscriptionSynced(),
  ]);
  const hasActiveSubscription = isActiveSubscription(subscription);

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>
      {!user.emailVerifiedAt && <EmailVerificationBanner />}
      <SubscriptionPanel
        plan={plan}
        subscription={subscription}
        locale={locale}
        user={user}
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('account')}</CardTitle>
            <CardDescription>
              {t('memberSince', { date: memberSince })}
            </CardDescription>
            <CreditsAvailableBadge
              className="w-fit"
              hasActiveSubscription={hasActiveSubscription}
            />
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('password.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
