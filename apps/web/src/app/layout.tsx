import type { Metadata } from 'next';
import './globals.css';
import { Cormorant_Garamond, Mulish } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { NextIntlClientProvider } from 'next-intl';
import {
  getLocale,
  getMessages,
  getTimeZone,
  getTranslations,
} from 'next-intl/server';

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
      <body>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={timeZone}
        >
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
