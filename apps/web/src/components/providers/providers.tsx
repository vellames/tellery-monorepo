'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { TriangleAlertIcon, RefreshCwIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/error-boundary';
import { CookieConsentBanner } from '@ai-history/ui';
import { getQueryClient } from '@/lib/query-client';

function ProvidersErrorFallback({ reset }: { reset: () => void }) {
  const t = useTranslations('errors.boundary');

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <TriangleAlertIcon className="text-warning size-10" />
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          {t('description')}
        </p>
      </div>
      <Button onClick={reset}>
        <RefreshCwIcon className="size-4" />
        {t('retry')}
      </Button>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        fallback={(_error, reset) => <ProvidersErrorFallback reset={reset} />}
      >
        {children}
      </ErrorBoundary>
      <CookieConsentBanner privacyHref="/privacy" />
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}
