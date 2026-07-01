import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  ProfileForm,
  ChangePasswordForm,
  LogoutButton,
} from '@/components/organisms';
import { CreditsAvailableBadge } from '@/components/molecules';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchMe } from '@/lib/api/me';
import { config } from '@/lib/config';

export default async function ProfilePage() {
  const user = await fetchMe();
  const t = await getTranslations('profile');
  const tSub = await getTranslations('subscription');
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
            <CreditsAvailableBadge
              count={user.availableCredits}
              className="w-fit"
            />
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('password.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
          <Link href={config.routes.subscription} className="block">
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="flex items-center justify-between py-5">
                <div className="space-y-1">
                  <p className="font-semibold">{tSub('link')}</p>
                  <p className="text-muted-foreground text-sm">
                    {tSub('linkDescription')}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground size-5" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      <LogoutButton />
    </section>
  );
}
