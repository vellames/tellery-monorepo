'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** When provided, a close (X) affordance is rendered with this accessible label. */
  closeLabel?: string;
}

export function Modal({
  open,
  onClose,
  children,
  className,
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

  const dialog = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      <div
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl',
          className
        )}
      >
        {closeLabel && (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 cursor-pointer text-stone-400 transition hover:text-stone-600"
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
