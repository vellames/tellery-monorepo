import type { Metadata } from 'next';
import { Cormorant_Garamond, Mulish } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { CookieConsentBanner } from '@ai-history/ui';
import {
  getLocale,
  getMessages,
  getTimeZone,
  getTranslations,
} from 'next-intl/server';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import './globals.css';

const GA_MEASUREMENT_ID = 'G-B07W6NN076';
const GTM_ID = 'GTM-NBX9MRQK';

const mulish = Mulish({ subsets: ['latin'], variable: '--font-sans' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');

  return {
    title: `${t('title')} - ${t('tagline')}`,
    description: t('description'),
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
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
    <html lang={locale} className={`${mulish.variable} ${cormorant.variable}`}>
      <head>
        <GoogleTagManager gtmId={GTM_ID} />
      </head>
      <body>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={timeZone}
        >
          {children}
          <CookieConsentBanner
            privacyHref={`${process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'}/privacy`}
          />
        </NextIntlClientProvider>
        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
