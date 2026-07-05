import Link from 'next/link';
import { Info, Play } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { config } from '@/lib/config';
import {
  StartSessionForm,
  StartSessionButton,
  AbandonSessionButton,
  SubscribeRequiredNotice,
} from '@/components/molecules';

export interface StoryStartActionsProps {
  historyId: string;
  activeSessionId: string | null;
  availableCredits: number;
  requiresSubscription: boolean;
}

/**
 * Renders the contextual CTA for starting/continuing a story session.
 * Extracted so landing pages (e.g. /ad-stories) can place the CTA in a
 * prominent spot while reusing the exact same logic as the catalog page.
 */
export async function StoryStartActions({
  historyId,
  activeSessionId,
  availableCredits,
  requiresSubscription,
}: StoryStartActionsProps) {
  const tObj = await getTranslations('stories');

  const hasSessionsLeft = availableCredits > 0;

  if (activeSessionId) {
    return (
      <div className="flex flex-col gap-3">
        <div className="border-gold/20 bg-clue/40 flex items-start gap-3 rounded-2xl border p-4">
          <Info className="text-gold mt-0.5 size-5 shrink-0" />
          <p className="text-foreground/70 text-sm leading-6">
            {tObj('activeSessionDisclaimer')}
          </p>
        </div>
        <Link
          href={config.routes.session(activeSessionId)}
          className="shadow-button mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-5 text-base font-bold text-[#4a111b] transition hover:scale-[1.01]"
        >
          <Play className="size-5 fill-current" />
          {tObj('continueButton')}
        </Link>
        <div className="mt-1 flex justify-center">
          <AbandonSessionButton sessionId={activeSessionId} />
        </div>
      </div>
    );
  }

  if (requiresSubscription) {
    return <SubscribeRequiredNotice />;
  }

  if (hasSessionsLeft) {
    return <StartSessionForm historyId={historyId} />;
  }

  return <StartSessionButton unavailable />;
}
