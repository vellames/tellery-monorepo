'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void> | void;
  confirmClassName?: string;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  confirmClassName,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [onConfirm]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        {trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label={cancelLabel}
            onClick={() => !loading && setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-200 bg-white shadow-2xl">
            <div className="flex flex-col gap-4 p-7">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-100">
                  <AlertTriangle className="size-5 text-red-600" />
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
                  aria-label={cancelLabel}
                  onClick={() => !loading && setOpen(false)}
                  className="cursor-pointer text-stone-400 transition hover:text-stone-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => !loading && setOpen(false)}
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
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
      )}
    </>
  );
}
