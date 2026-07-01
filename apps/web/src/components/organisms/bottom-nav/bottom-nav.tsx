'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';

interface NavItem {
  icon: LucideIcon;
  labelKey: 'home' | 'stories' | 'journey';
  href?: string;
}

const baseNavItems: NavItem[] = [
  { icon: Home, labelKey: 'home', href: config.routes.home },
  { icon: BookOpen, labelKey: 'stories', href: config.routes.stories },
  { icon: Compass, labelKey: 'journey', href: config.routes.journey },
];

const colsClass: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export interface BottomNavProps {
  hasSessions?: boolean;
}

export function BottomNav({ hasSessions = true }: BottomNavProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const navItems = baseNavItems.filter(
    (item) => item.labelKey !== 'journey' || hasSessions
  );
  const cols = navItems.length;

  return (
    <nav
      className={cn(
        'border-border bg-card/90 shadow-card fixed inset-x-4 bottom-4 z-20 grid rounded-[28px] border px-3 py-3 backdrop-blur lg:static lg:inset-x-auto lg:bottom-auto lg:mx-0 lg:w-full lg:max-w-none',
        colsClass[cols] ?? `grid-cols-${cols}`
      )}
    >
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
