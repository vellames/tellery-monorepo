import {
  Brain,
  CheckCircle2,
  Flag,
  MapPin,
  MessageSquare,
  Play,
  Search,
  Sparkles,
  Send,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { EventType, TimelineEvent } from '@/lib/sessions';

const EVENT_META: Record<
  EventType,
  { icon: LucideIcon; accent: string; label: string }
> = {
  session_start: {
    icon: Play,
    accent: 'text-chart-3',
    label: 'Início da sessão',
  },
  location_visited: { icon: MapPin, accent: 'text-chart-4', label: 'Local' },
  object_inspected: { icon: Search, accent: 'text-chart-2', label: 'Objeto' },
  object_message: {
    icon: MessageSquare,
    accent: 'text-chart-4',
    label: 'Mensagem de objeto',
  },
  character_message: {
    icon: MessageSquare,
    accent: 'text-chart-1',
    label: 'Mensagem de personagem',
  },
  clue_discovered: {
    icon: Sparkles,
    accent: 'text-gold-foreground',
    label: 'Pista',
  },
  llm_call: {
    icon: Brain,
    accent: 'text-muted-foreground',
    label: 'Chamada LLM',
  },
  conclusion_submitted: {
    icon: Send,
    accent: 'text-chart-3',
    label: 'Conclusão',
  },
  session_completed: {
    icon: CheckCircle2,
    accent: 'text-success',
    label: 'Fim da sessão',
  },
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum evento registrado para esta sessão.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-1">
      {events.map((event) => {
        const meta = EVENT_META[event.type];
        const Icon =
          event.type === 'session_completed' &&
          event.title.includes('abandoned')
            ? Flag
            : meta.icon;
        return (
          <li
            key={event.sortId}
            className="hover:bg-muted/40 grid grid-cols-[auto_1fr] gap-3 rounded-lg px-2 py-2"
          >
            <div className="flex flex-col items-center pt-0.5">
              <Icon className={cn('size-4', meta.accent)} />
              <span className="bg-border mt-1 w-px flex-1" />
            </div>
            <div className="min-w-0 pb-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-foreground text-sm font-medium">
                  {event.title}
                </span>
                <time
                  dateTime={event.at.toISOString()}
                  className="text-muted-foreground text-xs tabular-nums"
                >
                  {formatTimestamp(event.at)}
                </time>
              </div>
              {event.detail ? (
                <p className="text-muted-foreground mt-0.5 text-sm whitespace-pre-wrap">
                  {event.detail}
                </p>
              ) : null}
              {event.meta && Object.keys(event.meta).length > 0 ? (
                <EventMeta event={event} />
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function EventMeta({ event }: { event: TimelineEvent }) {
  const entries = Object.entries(event.meta ?? {}).filter(
    ([, v]) => v !== null
  );
  if (entries.length === 0) return null;

  return (
    <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-1">
          <dt className="text-muted-foreground/70">{key}:</dt>
          <dd className="text-foreground/80 tabular-nums">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
