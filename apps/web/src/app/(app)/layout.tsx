import { redirect } from 'next/navigation';
import { AppHeader, BottomNav } from '@/components/organisms';
import { getSessionUser } from '@/lib/auth/session';
import { fetchSubscription } from '@/lib/api/subscription-data';
import { isActiveSubscription } from '@/lib/types/subscription';
import { config } from '@/lib/config';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect(config.routes.login);

  let subscription = null;
  try {
    subscription = await fetchSubscription();
  } catch {
    // ignore — header hides the subscribe badge only on confirmed active subs
  }
  const hasActiveSubscription = isActiveSubscription(subscription);

  return (
    <main className="text-foreground min-h-svh bg-[radial-gradient(circle_at_top_left,#fff9ef_0,#f7f1e7_38%,#f1e5d4_100%)] pb-28 lg:pb-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-9 px-4 py-5 sm:px-6 lg:px-8">
        <AppHeader user={user} hasActiveSubscription={hasActiveSubscription} />
        <BottomNav />
        {children}
      </div>
    </main>
  );
}
