import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { LogoutButton } from '@/components/organisms';
import { getSessionUser } from '@/lib/auth/session';
import { config } from '@/lib/config';

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect(config.routes.login);
  const t = await getTranslations('common');

  return (
    <main className="bg-background flex min-h-svh flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">
          {t('greeting', { name: user.name })}
        </h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      <LogoutButton />
    </main>
  );
}
