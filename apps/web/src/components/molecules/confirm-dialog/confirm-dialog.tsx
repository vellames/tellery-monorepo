'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  /** When provided, the dialog manages its own open state via this trigger. */
  trigger?: React.ReactNode;
  /** Controlled open state. When provided, no trigger is rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** When omitted, the cancel button is hidden (single-action acknowledge dialog). */
  cancelLabel?: string;
  /** Accessible label for the backdrop and close (X) affordances. Defaults to cancelLabel. */
  closeLabel?: string;
  onConfirm: () => Promise<void> | void;
  /** Override the default warning icon. */
  icon?: React.ReactNode;
  /** Background class for the icon container (defaults to the warning tint). */
  iconClassName?: string;
  confirmClassName?: string;
}

export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
  icon,
  iconClassName,
  confirmClassName,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const dismissLabel = closeLabel ?? cancelLabel ?? confirmLabel;

  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled) onOpenChange?.(next);
      else setInternalOpen(next);
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, setOpen]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [onConfirm, setOpen]);

  const closeIfIdle = () => {
    if (!loading) setOpen(false);
  };

  const dialog = isOpen ? (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={closeIfIdle}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 p-7">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-xl',
                iconClassName ?? 'bg-red-100'
              )}
            >
              {icon ?? <AlertTriangle className="size-5 text-red-600" />}
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-semibold text-stone-900">
                {title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                {description}
              </p>
            </div>
            <button
              type="button"
              aria-label={dismissLabel}
              onClick={closeIfIdle}
              className="cursor-pointer text-stone-400 transition hover:text-stone-600"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            {cancelLabel !== undefined && (
              <button
                type="button"
                onClick={closeIfIdle}
                disabled={loading}
                className="flex-1 cursor-pointer rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                'inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50',
                confirmClassName ?? 'bg-red-600 hover:bg-red-700'
              )}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {trigger !== undefined && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer"
        >
          {trigger}
        </button>
      )}

      {typeof document !== 'undefined' && dialog
        ? createPortal(dialog, document.body)
        : dialog}
    </>
  );
}
