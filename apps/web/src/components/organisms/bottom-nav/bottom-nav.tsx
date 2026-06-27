import { BookOpen, Compass, Home, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, labelKey: 'home', active: true },
  { icon: BookOpen, labelKey: 'stories', active: false },
  { icon: Compass, labelKey: 'journey', active: false },
  { icon: UserRound, labelKey: 'profile', active: false },
] as const;

export function BottomNav() {
  const t = useTranslations('nav');

  return (
    <nav className="border-border bg-card/90 shadow-card fixed inset-x-4 bottom-4 z-20 mx-auto grid max-w-md grid-cols-4 rounded-[28px] border px-3 py-3 backdrop-blur lg:static lg:inset-x-auto lg:bottom-auto lg:mx-0 lg:w-full lg:max-w-none">
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
          <Icon className={cn('size-5', active && 'fill-primary/10')} />
          <span className="text-sm sm:text-base">{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
