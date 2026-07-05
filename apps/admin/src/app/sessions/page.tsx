import Link from 'next/link';

import { Pagination } from '@/components/pagination';
import { SessionStatusBadge } from '@/components/session-status-badge';
import {
  listSessions,
  SESSION_STATUS_VALUES,
  type SessionStatusFilter,
} from '@/lib/sessions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_FILTERS: SessionStatusFilter[] = ['all', ...SESSION_STATUS_VALUES];

const STATUS_FILTER_LABELS: Record<SessionStatusFilter, string> = {
  all: 'Todas',
  active: 'Ativas',
  completed: 'Concluídas',
  abandoned: 'Abandonadas',
};

type SearchParams = Promise<{ page?: string; status?: string }>;

function parseStatus(value: string | undefined): SessionStatusFilter {
  if (value && (STATUS_FILTERS as readonly string[]).includes(value)) {
    return value as SessionStatusFilter;
  }
  return 'all';
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page: pageParam, status: statusParam } = await searchParams;
  const status = parseStatus(statusParam);
  const page = Math.max(1, Number(pageParam) || 1);

  const { items, total, pageSize } = await listSessions({ page, status });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Sessões
        </h1>
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString('pt-BR')} no total · {items.length} por página
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-1">
        {STATUS_FILTERS.map((value) => {
          const params = new URLSearchParams();
          if (value !== 'all') params.set('status', value);
          const href = `/sessions${params.toString() ? `?${params.toString()}` : ''}`;
          const isActive = status === value;
          return (
            <Link
              key={value}
              href={href}
              className={
                isActive
                  ? 'bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-1 text-sm transition-colors'
              }
            >
              {STATUS_FILTER_LABELS[value]}
            </Link>
          );
        })}
      </div>

      <div className="ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
            <tr>
              <th className="px-4 py-2 font-medium">Título</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Usuário</th>
              <th className="px-4 py-2 text-right font-medium">Interações</th>
              <th className="px-4 py-2 text-right font-medium">Calls</th>
              <th className="px-4 py-2 font-medium">Iniciada</th>
              <th className="px-4 py-2 font-medium">Duração</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground px-4 py-8 text-center italic"
                >
                  Nenhuma sessão encontrada
                  {status !== 'all'
                    ? ` com status "${STATUS_FILTER_LABELS[status]}"`
                    : ''}
                  .
                </td>
              </tr>
            ) : (
              items.map((session) => (
                <tr key={session.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link
                      href={`/sessions/${session.id}`}
                      className="text-foreground hover:text-primary font-medium underline-offset-2 hover:underline"
                    >
                      {session.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <SessionStatusBadge status={session.status} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-foreground">
                        {session.user.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {session.user.email ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {session.interactions.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {session.calls.toLocaleString('pt-BR')}
                  </td>
                  <td className="text-muted-foreground px-4 py-2 tabular-nums">
                    {formatDateTime(session.startedAt)}
                  </td>
                  <td className="text-muted-foreground px-4 py-2 tabular-nums">
                    {session.completedAt
                      ? formatDuration(
                          session.completedAt.getTime() -
                            session.startedAt.getTime()
                        )
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        basePath="/sessions"
        page={page}
        totalPages={totalPages}
        extraParams={{ status: statusParam }}
      />
    </main>
  );
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 0) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
}
