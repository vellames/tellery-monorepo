'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const togglePillTones = cva('', {
  variants: {
    tone: {
      neutral: 'border-transparent bg-primary text-primary-foreground',
      free: 'border-success/40 bg-success text-white',
      premium: 'border-gold/40 bg-gold text-gold-foreground',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export interface TogglePillProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof togglePillTones> {
  pressed: boolean;
}

export function TogglePill({
  pressed,
  tone,
  className,
  children,
  type = 'button',
  ...props
}: TogglePillProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur transition',
        pressed
          ? togglePillTones({ tone })
          : 'border-border bg-card text-foreground/70 hover:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
