import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppHeader, BottomNav, TempUserBanner } from '@/components/organisms';
import { getSessionUser } from '@/lib/auth/session';
import { fetchSessions } from '@/lib/api/session';
import { isTemporaryUser } from '@/lib/types/auth';
import { config } from '@/lib/config';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('common');
  const user = await getSessionUser();
  if (!user) redirect(config.routes.login);

  let hasSessions = false;
  try {
    const sessions = await fetchSessions(1, 1);
    hasSessions = sessions.items.length > 0;
  } catch {
    // ignore — treat as no sessions (hides the Journey nav item)
  }

  return (
    <main className="text-foreground min-h-svh bg-[radial-gradient(circle_at_top_left,#fff9ef_0,#f7f1e7_38%,#f1e5d4_100%)] pb-28 lg:pb-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-9 px-4 py-5 sm:px-6 lg:px-8">
        <AppHeader user={user} />
        <BottomNav hasSessions={hasSessions} />
        {isTemporaryUser(user) && <TempUserBanner dismissible={false} />}
        {children}
        <footer className="text-muted-foreground border-border mt-2 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs sm:flex-row">
          <div className="flex items-center gap-4">
            <Link
              href={config.routes.privacy}
              className="hover:text-primary underline"
            >
              {t('privacyPolicy')}
            </Link>
            <Link
              href={config.routes.terms}
              className="hover:text-primary underline"
            >
              {t('termsOfUse')}
            </Link>
          </div>
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </footer>
      </div>
    </main>
  );
}
