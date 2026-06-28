'use client';

import { useState } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/molecules';

export function AbandonSessionButton({ sessionId }: { sessionId: string }) {
  const t = useTranslations('stories');
  const router = useRouter();
  const [abandoned, setAbandoned] = useState(false);

  if (abandoned) {
    return (
      <div className="border-success/30 bg-success/5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium text-green-700">
        <CheckCircle2 className="size-4 shrink-0" />
        {t('abandonedFeedback')}
      </div>
    );
  }

  return (
    <ConfirmDialog
      trigger={
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm font-semibold transition hover:text-red-600">
          <Trash2 className="size-4" />
          {t('abandonButton')}
        </span>
      }
      title={t('abandonTitle')}
      description={t('abandonDescription')}
      confirmLabel={t('abandonConfirm')}
      cancelLabel={t('abandonCancel')}
      onConfirm={async () => {
        await fetch(`/api/session/${sessionId}/abandon`, { method: 'POST' });
        setAbandoned(true);
        toast.success(t('abandonedToast'));
        router.refresh();
      }}
    />
  );
}
