'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { createTemporaryUserRequest } from '@/lib/api/auth';

/**
 * Creates a temporary guest user on mount (client-side, via the BFF), then
 * triggers a full router refresh so the surrounding server component
 * re-renders authenticated as a temporary user.
 *
 * Client-side creation was chosen over a server-side cookie set so the flow
 * works reliably inside in-app browsers (TikTok, Instagram), which sometimes
 * handle server-set cookies on navigation responses inconsistently.
 */
export function TempUserLauncher() {
  const router = useRouter();
  const t = useTranslations('adStories');
  const startedRef = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    createTemporaryUserRequest()
      .then(() => {
        if (!cancelled) router.refresh();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (failed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="text-foreground/70">{t('createUserFailed')}</p>
        <Button
          onClick={() => {
            setFailed(false);
            startedRef.current = false;
            createTemporaryUserRequest()
              .then(() => router.refresh())
              .catch(() => setFailed(true));
          }}
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <Loader2 className="text-primary size-8 animate-spin" />
      <p className="text-foreground/70">{t('creatingUser')}</p>
    </div>
  );
}
