'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, Home, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';

interface NavItem {
  icon: LucideIcon;
  labelKey: 'home' | 'stories' | 'journey' | 'profile';
  href?: string;
}

const navItems: NavItem[] = [
  { icon: Home, labelKey: 'home', href: config.routes.home },
  { icon: BookOpen, labelKey: 'stories', href: config.routes.stories },
  { icon: Compass, labelKey: 'journey', href: config.routes.journey },
  { icon: UserRound, labelKey: 'profile', href: config.routes.profile },
];

export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className="border-border bg-card/90 shadow-card fixed inset-x-4 bottom-4 z-20 mx-auto grid max-w-md grid-cols-4 rounded-[28px] border px-3 py-3 backdrop-blur lg:static lg:inset-x-auto lg:bottom-auto lg:mx-0 lg:w-full lg:max-w-none">
      {navItems.map(({ icon: Icon, labelKey, href }) => {
        const isActive =
          !!href && (pathname === href || pathname.startsWith(`${href}/`));
        const className = cn(
          'flex items-center justify-center gap-2 rounded-2xl px-3 py-3',
          isActive
            ? 'text-primary font-bold'
            : 'text-muted-foreground font-semibold'
        );
        const content = (
          <>
            <Icon className={cn('size-5', isActive && 'fill-primary/10')} />
            <span className="text-sm sm:text-base">{t(labelKey)}</span>
          </>
        );

        if (href) {
          return (
            <Link className={className} href={href} key={labelKey}>
              {content}
            </Link>
          );
        }

        return (
          <button className={className} key={labelKey} type="button">
            {content}
          </button>
        );
      })}
    </nav>
  );
}
