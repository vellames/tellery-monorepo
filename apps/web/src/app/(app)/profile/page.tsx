import { getLocale, getTranslations } from 'next-intl/server';
import {
  ProfileForm,
  ChangePasswordForm,
  LogoutButton,
} from '@/components/organisms';
import { SessionsAvailableBadge } from '@/components/molecules';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchMe } from '@/lib/api/me';

export default async function ProfilePage() {
  const user = await fetchMe();
  const t = await getTranslations('profile');
  const locale = await getLocale();
  const memberSince = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(user.createdAt));

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('account')}</CardTitle>
            <CardDescription>
              {t('memberSince', { date: memberSince })}
            </CardDescription>
            <SessionsAvailableBadge
              count={user.availableSessions}
              className="w-fit"
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
      <LogoutButton />
    </section>
  );
}
