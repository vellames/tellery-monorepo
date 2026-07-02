'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalVariant = 'light' | 'scene';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes merged into the dialog panel (height, layout, grain, etc.). */
  className?: string;
  /** Visual theme + layout. `light` (default) is a centered white card; `scene` is the dark immersive bottom-sheet used by the session experience. */
  variant?: ModalVariant;
  /** Accessible label for the dialog. */
  ariaLabel?: string;
  /** When provided, a close (X) affordance is rendered with this accessible label. */
  closeLabel?: string;
}

const SCENE_BACKDROP_ANIMATION = 'scene-fade-in 0.25s ease forwards';
const SCENE_PANEL_ANIMATION = 'scene-fade-up 0.4s cubic-bezier(0.16,1,0.3,1)';

const VARIANTS = {
  light: {
    wrapper: 'fixed inset-0 z-[60] flex items-center justify-center p-6',
    backdrop: 'absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm',
    panel:
      'relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl',
    closeButton:
      'absolute top-4 right-4 z-10 cursor-pointer text-stone-400 transition hover:text-stone-600',
  },
  scene: {
    wrapper:
      'fixed inset-0 z-[60] flex items-end justify-center sm:items-center',
    backdrop:
      'absolute inset-0 cursor-default bg-[#0a0203]/80 backdrop-blur-sm',
    panel:
      'relative w-full max-w-2xl overflow-hidden rounded-t-[28px] border border-[#fff9ef]/12 bg-[#1b070b] shadow-2xl sm:rounded-[28px]',
    closeButton:
      'absolute top-4 right-4 z-10 grid size-9 cursor-pointer place-items-center rounded-full border border-[#fff9ef]/15 bg-black/40 text-[#fff9ef]/80 backdrop-blur transition hover:bg-black/60 hover:text-[#fff9ef]',
  },
} as const;

export function Modal({
  open,
  onClose,
  children,
  className,
  variant = 'light',
  ariaLabel,
  closeLabel,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const styles = VARIANTS[variant];

  const dialog = (
    <div
      className={styles.wrapper}
      role="dialog"
      aria-modal="true"
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        style={
          variant === 'scene'
            ? { animation: SCENE_BACKDROP_ANIMATION }
            : undefined
        }
        className={styles.backdrop}
      />

      <div
        className={cn(styles.panel, className)}
        style={
          variant === 'scene' ? { animation: SCENE_PANEL_ANIMATION } : undefined
        }
      >
        {closeLabel && (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className={styles.closeButton}
          >
            <X className="size-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(dialog, document.body)
    : dialog;
}
