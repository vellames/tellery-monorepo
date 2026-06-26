import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/molecules';
import { config } from '@/lib/config';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('common');

  return (
    <div className="flex min-h-svh flex-col lg:grid lg:grid-cols-2">
      <div className="relative h-44 shrink-0 lg:hidden">
        <Image
          src="/auth-cover.jpg"
          alt="Tellery"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>

      <div className="relative hidden bg-[linear-gradient(135deg,var(--primary)_0%,#3a1018_100%)] lg:block">
        <Image
          src="/auth-cover.jpg"
          alt="Tellery"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>

      <div className="bg-background relative flex flex-1 flex-col p-6 sm:p-10">
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex justify-center">
              <Image
                src="/logo.png"
                alt="Tellery"
                width={140}
                height={56}
                priority
                className="dark:invert"
              />
            </div>
            {children}
          </div>
        </div>
        <footer className="flex items-center justify-center gap-4 pt-8 text-sm">
          <Link
            href={config.routes.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary underline"
          >
            {t('privacyPolicy')}
          </Link>
          <Link
            href={config.routes.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary underline"
          >
            {t('termsOfUse')}
          </Link>
        </footer>
      </div>
    </div>
  );
}
