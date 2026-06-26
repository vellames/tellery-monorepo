import { BookOpen, Compass, Menu, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: BookOpen, labelKey: 'stories', active: true },
  { icon: Compass, labelKey: 'journey', active: false },
  { icon: UserRound, labelKey: 'profile', active: false },
] as const;

export function BottomNav() {
  const t = useTranslations('nav');

  return (
    <>
      <nav className="border-border bg-card/90 shadow-card fixed inset-x-4 bottom-4 z-20 mx-auto grid max-w-6xl grid-cols-3 rounded-[28px] border px-3 py-3 backdrop-blur">
        {navItems.map(({ icon: Icon, labelKey, active }) => (
          <button
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl px-3 py-3',
              active
                ? 'text-primary font-bold'
                : 'text-muted-foreground font-semibold'
            )}
            key={labelKey}
            type="button"
          >
            <Icon className={cn('size-6', active && 'fill-primary/10')} />
            <span className="hidden sm:inline">{t(labelKey)}</span>
          </button>
        ))}
      </nav>

      <button
        className="border-border bg-card text-primary shadow-card fixed right-5 bottom-5 z-30 grid size-12 place-items-center rounded-full border sm:hidden"
        type="button"
        aria-label={t('openMenu')}
      >
        <Menu className="size-5" />
      </button>
    </>
  );
}
