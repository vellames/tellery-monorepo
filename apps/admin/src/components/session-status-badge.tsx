import type { HistorySessionStatus } from '@prisma/client';

import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<HistorySessionStatus, string> = {
  active: 'bg-warning/15 text-warning ring-warning/30',
  completed: 'bg-success/15 text-success ring-success/30',
  abandoned: 'bg-muted text-muted-foreground ring-border',
};

const STATUS_LABELS: Record<HistorySessionStatus, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  abandoned: 'Abandonada',
};

export function SessionStatusBadge({
  status,
}: {
  status: HistorySessionStatus;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
