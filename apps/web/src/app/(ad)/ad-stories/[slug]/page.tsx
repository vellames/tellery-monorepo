import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { fetchStoryBySlug } from '@/lib/api/story';
import { fetchSessions } from '@/lib/api/session';
import { fetchAvailableCredits } from '@/lib/api/credits-server';
import { fetchSubscription } from '@/lib/api/subscription-data';
import { getSessionUser } from '@/lib/auth/session';
import { isTemporaryUser } from '@/lib/types/auth';
import { isActiveSubscription } from '@/lib/types/subscription';
import { config } from '@/lib/config';
import {
  StoryDetailContent,
  StoryStartActions,
  TempUserBanner,
  TempUserLauncher,
} from '@/components/organisms';

export default async function AdStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations('adStories');

  const user = await getSessionUser();

  // Fluxo 1: already a permanent user → go home
  if (user && !isTemporaryUser(user)) {
    redirect(config.routes.home);
  }

  // Fluxo 3: not logged in → create a temp user client-side first (the catalog
  // endpoints require auth, so we cannot resolve the story yet). Once the
  // launcher creates the temp user and calls router.refresh(), this page
  // re-renders authenticated and falls through to fluxo 2.
  if (!user) {
    return <TempUserLauncher />;
  }

  // Fluxo 2: logged in as a temporary user — now we can fetch the (auth-gated)
  // story catalog. Resolve by slug, then load the full detail by id.
  const story = await fetchStoryBySlug(slug).catch(() => null);
  if (!story) {
    notFound();
  }

  // Premium stories require a real account + subscription.
  if (!story.isFree) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-16 text-center">
        <h1 className="font-heading text-primary text-2xl font-semibold tracking-tight">
          {t('premiumTitle')}
        </h1>
        <p className="text-foreground/70 leading-7">
          {t('premiumDescription')}
        </p>
        <Link
          href={config.routes.register}
          className="shadow-button inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-4 text-base font-bold text-[#4a111b] transition hover:scale-[1.01]"
        >
          {t('premiumCta')}
        </Link>
      </div>
    );
  }

  // Free story: gather the data needed by the shared detail content.
  let activeSessionId: string | null = null;
  try {
    const sessions = await fetchSessions(1, 50, 'active');
    const active = sessions.items.find((s) => s.storyId === story.id);
    activeSessionId = active?.id ?? null;
  } catch {
    // ignore — treat as no active session
  }

  let availableCredits = 0;
  try {
    availableCredits = await fetchAvailableCredits();
  } catch {
    // ignore — treat as no credits
  }

  let subscription = null;
  try {
    subscription = await fetchSubscription();
  } catch {
    // ignore — treat as no active subscription
  }
  const hasActiveSubscription = isActiveSubscription(subscription);

  const requiresSubscription = !story.isFree && !hasActiveSubscription;

  return (
    <>
      <StoryStartActions
        storyId={story.id}
        activeSessionId={activeSessionId}
        availableCredits={availableCredits}
        requiresSubscription={requiresSubscription}
      />
      <StoryDetailContent
        story={story}
        activeSessionId={activeSessionId}
        availableCredits={availableCredits}
        hasActiveSubscription={hasActiveSubscription}
        hideBackLink
        hideStartActions
      />
      <TempUserBanner dismissible={false} />
    </>
  );
}
