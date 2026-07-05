import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { SessionStatusBadge } from '@/components/session-status-badge';
import { Timeline } from '@/components/timeline';
import {
  buildTimeline,
  firstUserAction,
  getSessionDetail,
  sumCostUsd,
} from '@/lib/sessions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = Promise<{ id: string }>;

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  permanent: 'permanente',
  temporary: 'temporária',
};

const ENDING_TYPE_LABELS: Record<string, string> = {
  full_truth: 'verdade completa',
  partial_truth: 'verdade parcial',
  wrong_accusation: 'acusação errada',
};

const PURPOSE_LABELS: Record<string, string> = {
  intent: 'intenção',
  character: 'personagem',
  object: 'objeto',
  audio: 'áudio',
};

export default async function SessionDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  const events = buildTimeline(session);
  const cost = sumCostUsd(session.llmCalls);
  const durationMs = session.completedAt
    ? session.completedAt.getTime() - session.startedAt.getTime()
    : null;
  const firstAction = firstUserAction(events);
  const timeToFirstMs = firstAction
    ? firstAction.at.getTime() - session.startedAt.getTime()
    : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link
        href="/sessions"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Voltar às sessões
      </Link>

      <header className="mb-6 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {session.title}
          </h1>
          <SessionStatusBadge status={session.status} />
        </div>
        <p className="text-muted-foreground text-sm">
          {session.user.name} · {session.user.email ?? 'sem e-mail'} · conta{' '}
          {ACCOUNT_TYPE_LABELS[session.user.accountType] ??
            session.user.accountType}
        </p>
        <p className="text-muted-foreground text-sm tabular-nums">
          {formatDateTime(session.startedAt)}
          {session.completedAt
            ? ` → ${formatDateTime(session.completedAt)}`
            : ' (em andamento)'}
          {durationMs !== null ? ` · ${formatDuration(durationMs)}` : ''}
        </p>
        {timeToFirstMs !== null ? (
          <p className="text-muted-foreground text-sm tabular-nums">
            Tempo até a 1ª ação ({firstAction?.title.toLowerCase()}):{' '}
            <span className="text-foreground font-medium">
              {formatDuration(timeToFirstMs)}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Sem ações registradas nesta sessão.
          </p>
        )}
      </header>

      <section aria-label="Resumo de custos" className="mb-8">
        <h2 className="mb-2 text-xs font-medium tracking-wide uppercase">
          Custo de LLM
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Custo total" value={`$${cost.totalUsd.toFixed(6)}`} />
          <Stat
            label="Chamadas"
            value={cost.totalCalls.toLocaleString('pt-BR')}
          />
          <Stat
            label="Tokens"
            value={cost.totalTokens.toLocaleString('pt-BR')}
          />
          <Stat
            label="Pistas descobertas"
            value={`${session.clues.filter((c) => c.discovered).length}/${session.clues.length}`}
          />
        </div>
        {Object.keys(cost.byPurpose).length > 0 ? (
          <div className="ring-foreground/10 mt-2 overflow-hidden rounded-lg ring-1">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
                <tr>
                  <th className="px-3 py-1.5 font-medium">Propósito</th>
                  <th className="px-3 py-1.5 text-right font-medium">
                    Chamadas
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium">Tokens</th>
                  <th className="px-3 py-1.5 text-right font-medium">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {Object.entries(cost.byPurpose).map(([purpose, bucket]) => (
                  <tr key={purpose}>
                    <td className="px-3 py-1.5">
                      {PURPOSE_LABELS[purpose] ?? purpose}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {bucket.calls}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {bucket.tokens.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      ${bucket.usd.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {session.conclusion ? (
        <section aria-label="Conclusão" className="mb-8">
          <h2 className="mb-2 text-xs font-medium tracking-wide uppercase">
            Conclusão
          </h2>
          <div className="ring-foreground/10 overflow-hidden rounded-lg ring-1">
            <table className="w-full text-sm">
              <tbody className="divide-border divide-y">
                {session.conclusion.answers.map((answer) => (
                  <tr key={answer.id}>
                    <td className="text-muted-foreground w-1/2 px-3 py-1.5 align-top">
                      {answer.field.label}
                    </td>
                    <td className="px-3 py-1.5 align-top">
                      {answer.option.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {session.ending ? (
        <section aria-label="Final" className="mb-8">
          <h2 className="mb-2 text-xs font-medium tracking-wide uppercase">
            Final ·{' '}
            {ENDING_TYPE_LABELS[session.ending.endingSnapshot.type] ??
              session.ending.endingSnapshot.type.replace(/_/g, ' ')}
          </h2>
          <div className="bg-card ring-foreground/10 rounded-lg p-4 ring-1">
            <p className="font-heading text-lg font-semibold">
              {session.ending.endingSnapshot.title}
            </p>
            {session.ending.endingSnapshot.summary ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {session.ending.endingSnapshot.summary}
              </p>
            ) : null}
            {session.ending.score ? (
              <p className="mt-2 text-xs tabular-nums">
                Pistas {session.ending.score.discoveredClues}/
                {session.ending.score.totalClues} · Obrigatórias{' '}
                {session.ending.score.requiredCluesDiscovered}/
                {session.ending.score.totalRequiredClues} · Respostas{' '}
                {session.ending.score.correctAnswers}/
                {session.ending.score.totalAnswers}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section aria-label="Linha do tempo">
        <h2 className="mb-2 text-xs font-medium tracking-wide uppercase">
          Linha do tempo cronológica
        </h2>
        <Timeline events={events} />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card ring-foreground/10 rounded-lg p-3 ring-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-heading text-xl font-semibold tabular-nums">{value}</p>
    </div>
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
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    return seconds > 0
      ? `${totalMinutes}min ${seconds}s`
      : `${totalMinutes}min`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
