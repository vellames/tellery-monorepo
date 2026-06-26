import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/organisms';
import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <div className="space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-primary text-2xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>
      <LoginForm />
      <div className="text-center">
        <p className="text-muted-foreground text-sm">{t('noAccount')}</p>
        <Button
          variant="outline"
          size="lg"
          className="mt-3 w-full font-semibold"
          nativeButton={false}
          render={<Link href={config.routes.register} />}
        >
          {t('createAccount')}
        </Button>
      </div>
    </div>
  );
}
