import type { Metadata } from 'next';
import { Cormorant_Garamond, Mulish } from 'next/font/google';
import Link from 'next/link';

import './globals.css';
import { cn } from '@/lib/utils';

const mulish = Mulish({ subsets: ['latin'], variable: '--font-sans' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'AI History · Admin',
  description: 'Internal metrics dashboard (localhost only).',
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  { href: '/', label: 'Painel' },
  { href: '/sessions', label: 'Sessões' },
  { href: '/leads', label: 'Leads' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(mulish.variable, cormorant.variable)}
    >
      <body className="bg-background text-foreground min-h-dvh antialiased">
        <header className="bg-card/60 ring-foreground/5 sticky top-0 z-10 border-b backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
            <Link
              href="/"
              className="font-heading text-lg font-semibold tracking-tight"
            >
              AI History <span className="text-muted-foreground">·</span>{' '}
              <span className="text-gold-foreground">Admin</span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
