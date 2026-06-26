import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '@/components/organisms';

export default async function ForgotPasswordPage() {
  const t = await getTranslations('forgotPassword');

  return (
    <div className="space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-primary text-2xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
