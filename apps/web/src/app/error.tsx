'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OctagonXIcon, RefreshCwIcon, HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors.boundary');
  const router = useRouter();

  useEffect(() => {
    console.error('[RouteError]', error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <OctagonXIcon className="text-destructive size-12" />
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          {t('description')}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RefreshCwIcon className="size-4" />
          {t('retry')}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(config.routes.home)}
        >
          <HomeIcon className="size-4" />
          {t('home')}
        </Button>
      </div>
    </div>
  );
}
