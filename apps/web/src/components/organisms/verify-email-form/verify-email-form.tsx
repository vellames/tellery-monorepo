'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, MailCheck, CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useVerifyEmail } from '@/lib/hooks/use-auth';
import { config } from '@/lib/config';
import { setLocale } from '@/i18n/actions';

type Status = 'verifying' | 'success' | 'error';

export function VerifyEmailForm() {
  const t = useTranslations('verifyEmail');
  const tCommon = useTranslations('common');
  const params = useSearchParams();
  const token = params.get('token');
  const lang = params.get('lang');

  const verifyEmail = useVerifyEmail();
  const startedRef = useRef(false);
  const [status, setStatus] = useState<Status>('verifying');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      if (lang) {
        await setLocale(lang as 'en' | 'pt-BR');
      }
      if (!token) {
        setStatus('error');
        return;
      }
      try {
        await verifyEmail.mutateAsync(token);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    void run();
  }, [lang, token, verifyEmail]);

  if (status === 'success') {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="text-success mx-auto size-10" />
        <h2 className="font-heading text-primary text-xl font-bold">
          {t('successTitle')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('successMessage')}</p>
        <Button
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href={config.routes.profile} />}
        >
          {t('continue')}
        </Button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-4 text-center">
        <CircleAlert className="text-destructive mx-auto size-10" />
        <h2 className="font-heading text-primary text-xl font-bold">
          {t('invalidTitle')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('invalidMessage')}</p>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href={config.routes.home} />}
        >
          {tCommon('backToHome')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <Loader2 className="text-gold mx-auto size-10 animate-spin" />
      <p className="text-muted-foreground text-sm">{t('verifying')}</p>
    </div>
  );
}
