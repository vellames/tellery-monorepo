import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { VerifyEmailForm } from '@/components/organisms';

export default async function VerifyEmailPage() {
  const t = await getTranslations('verifyEmail');

  return (
    <div className="space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-primary text-2xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
