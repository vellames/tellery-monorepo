import type { Metadata } from 'next';
import './globals.css';
import { Inter, Fraunces } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'AI History',
  description: 'AI History',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(inter.variable, fraunces.variable)}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
