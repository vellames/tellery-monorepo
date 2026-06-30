import { getLocale, getTranslations } from 'next-intl/server';
import { ProfileForm, LogoutButton } from '@/components/organisms';
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
    <section className="mx-auto w-full max-w-md space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>
      <ProfileForm user={user} />
      <p className="text-muted-foreground text-sm">
        {t('memberSince', { date: memberSince })}
      </p>
      <LogoutButton />
    </section>
  );
}
