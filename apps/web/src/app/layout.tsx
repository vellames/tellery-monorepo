import type { Metadata } from 'next';
// Cookiebot desativado em favor do banner próprio (CookieConsentBanner).
// Para reativar, descomente o import e o <Script id="cookiebot" /> no <head>.
// import Script from 'next/script';
import './globals.css';
import { Cormorant_Garamond, Mulish } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { config } from '@/lib/config';
import { CookieConsentBanner } from '@ai-history/ui';
import { NextIntlClientProvider } from 'next-intl';
import {
  getLocale,
  getMessages,
  getTimeZone,
  getTranslations,
} from 'next-intl/server';
import { GoogleAnalytics } from '@next/third-parties/google';
import { GoogleTagManager } from '@next/third-parties/google';

const GA_MEASUREMENT_ID = 'G-B07W6NN076';
const GTM_ID = 'GTM-NBX9MRQK';

const mulish = Mulish({ subsets: ['latin'], variable: '--font-sans' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: `Tellery - ${t('tagline')}`,
    description: t('tagline'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(mulish.variable, cormorant.variable)}
    >
      <head>
        {/*
          Cookiebot desativado em favor do banner próprio.
          Para reativar, restaure o bloco comentado abaixo:
          <Script
            id="cookiebot"
            src="https://consent.cookiebot.com/uc.js"
            data-cbid="c33c63d0-7dc9-4bb6-a0af-2aa1bcb3df86"
            data-blockingmode="auto"
            strategy="beforeInteractive"
          />
        */}
        <GoogleTagManager gtmId={GTM_ID} />
      </head>
      <body>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={timeZone}
        >
          <Providers>{children}</Providers>
          <CookieConsentBanner privacyHref={config.routes.privacy} />
        </NextIntlClientProvider>
        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
