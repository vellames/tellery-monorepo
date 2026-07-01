'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CompassIcon, HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';

export default function NotFound() {
  const t = useTranslations('errors.notFound');

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <CompassIcon className="text-muted-foreground size-12" />
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          {t('description')}
        </p>
      </div>
      <Button variant="outline" render={<Link href={config.routes.home} />}>
        <HomeIcon className="size-4" />
        {t('home')}
      </Button>
    </div>
  );
}
