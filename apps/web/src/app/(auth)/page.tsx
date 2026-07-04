import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/organisms';
import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';
import { withQueryParams } from '@/lib/with-query-params';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations('auth');
  const params = new URLSearchParams();
  const resolvedSearchParams = await searchParams;
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (value === undefined) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      params.append(key, v);
    }
  }
  const registerHref = withQueryParams(
    config.routes.register,
    params.toString()
  );

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
          render={<Link href={registerHref} />}
        >
          {t('createAccount')}
        </Button>
      </div>
    </div>
  );
}
