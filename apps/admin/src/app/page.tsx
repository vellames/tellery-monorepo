import { ArrowUpRight } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  get30DayStats,
  getConversionFunnel,
  type ConversionFunnel,
  type DailyPoint,
  type DurationSummary,
  type Stats,
} from '@/lib/stats';

type Accent = 'chart-1' | 'chart-2' | 'chart-3';

// Tailwind v4 scans source for literal class names, so dynamic strings like
// `text-chart-${x}` are invisible to the compiler. These maps keep the chart
// tokens as plain literals so they end up in the generated CSS.
const ACCENT_TEXT: Record<Accent, string> = {
  'chart-1': 'text-chart-1',
  'chart-2': 'text-chart-2',
  'chart-3': 'text-chart-3',
};
const ACCENT_BG: Record<Accent, string> = {
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const [stats, funnel] = await Promise.all([
    get30DayStats(),
    getConversionFunnel(),
  ]);
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-1">
        <span className="font-heading text-gold-foreground text-sm font-medium tracking-wide uppercase">
          Interno · apenas localhost
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          AI History · Admin
        </h1>
        <p className="text-muted-foreground text-sm">
          Últimos {stats.windowDays} dias · até {todayLabel}
        </p>
      </header>

      <section
        aria-label="Totais"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          label="Total de Leads"
          value={stats.totals.leads}
          accent="chart-1"
        />
        <StatCard
          label="Total de Usuários"
          value={stats.totals.users}
          accent="chart-3"
          hint="Contas permanentes + temporárias"
        />
        <StatCard
          label="Total de Sessões"
          value={stats.totals.sessions}
          accent="chart-2"
        />
      </section>

      <section
        aria-label="Detalhamento diário"
        className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <ChartCard
          title="Novos Leads"
          points={stats.byDay.leads}
          accent="chart-1"
        />
        <ChartCard
          title="Novos Usuários"
          points={stats.byDay.users}
          accent="chart-3"
        />
        <ChartCard
          title="Novas Sessões"
          points={stats.byDay.sessions}
          accent="chart-2"
        />
      </section>

      <FunnelSection funnel={funnel} />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Conversion funnel
// ---------------------------------------------------------------------------

function FunnelSection({ funnel }: { funnel: ConversionFunnel }) {
  const leadConversionRate =
    funnel.leads > 0 ? (funnel.convertedLeads / funnel.leads) * 100 : 0;
  const tempToPermRate =
    funnel.temporaryUsers > 0
      ? (funnel.permanentUsers / funnel.temporaryUsers) * 100
      : 0;
  const totalUsers = funnel.temporaryUsers + funnel.permanentUsers;
  const startedPct = (funnel.startedHistoryRate * 100).toFixed(1);

  // Buckets are cumulative/overlapping by design: atLeast1 ⊃ atLeast10 ⊃ atLeast20.
  // `zero` and `atLeast1` are mutually exclusive and together cover every session,
  // so their sum is the total number of sessions started in the window.
  const { zero, atLeast1, atLeast10, atLeast20 } = funnel.interactionBuckets;
  const totalSessions = zero + atLeast1;

  return (
    <>
      <section aria-label="Funil de conversão" className="mt-10">
        <h2 className="font-heading mb-3 text-xl font-semibold tracking-tight">
          Funil de conversão
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Base: últimos {funnel.windowDays} dias.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Leads → Usuários</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <FunnelRow
                label="Leads"
                value={funnel.leads}
                pct={funnel.leads > 0 ? 100 : 0}
              />
              <FunnelRow
                label="Leads convertidos em usuários"
                value={funnel.convertedLeads}
                pct={leadConversionRate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Temporários → Permanentes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <FunnelRow
                label="Usuários temporários"
                value={funnel.temporaryUsers}
                pct={
                  totalUsers > 0
                    ? (funnel.temporaryUsers / totalUsers) * 100
                    : 0
                }
              />
              <FunnelRow
                label="Usuários permanentes"
                value={funnel.permanentUsers}
                pct={tempToPermRate}
                hint={`${tempToPermRate.toFixed(1)}% dos temporários`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Início de história</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <FunnelRow
                label="Usuários (total)"
                value={totalUsers}
                pct={totalUsers > 0 ? 100 : 0}
              />
              <FunnelRow
                label="Iniciaram pelo menos 1 história"
                value={funnel.usersStartedHistory}
                pct={Number(startedPct)}
                hint={`${startedPct}% dos usuários`}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <TimeToFirstHistorySection summary={funnel.timeToFirstHistory} />

      <section aria-label="Interações por história iniciada" className="mt-6">
        <h2 className="font-heading mb-1 text-xl font-semibold tracking-tight">
          Engajamento nas histórias iniciadas
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Distribuição do número de interações (mensagens de personagem +
          objeto, excluindo system prompt) por sessão iniciada nos últimos{' '}
          {funnel.windowDays} dias. Percentuais sobre o total de {totalSessions}{' '}
          sessões iniciadas; níveis ≥ 1 são cumulativos entre si.
        </p>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-2">
            <FunnelRow
              label="0 interações"
              value={zero}
              pct={pct(zero, totalSessions)}
              hint={`${pctFmt(zero, totalSessions)} das sessões`}
            />
            <FunnelRow
              label="≥ 1 interação"
              value={atLeast1}
              pct={pct(atLeast1, totalSessions)}
              hint={`${pctFmt(atLeast1, totalSessions)} das sessões`}
            />
            <FunnelRow
              label="≥ 10 interações"
              value={atLeast10}
              pct={pct(atLeast10, totalSessions)}
              hint={`${pctFmt(atLeast10, atLeast1)} das com ≥ 1`}
            />
            <FunnelRow
              label="≥ 20 interações"
              value={atLeast20}
              pct={pct(atLeast20, totalSessions)}
              hint={`${pctFmt(atLeast20, atLeast1)} das com ≥ 1`}
            />
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function pctFmt(numerator: number, denominator: number): string {
  return `${pct(numerator, denominator).toFixed(1)}%`;
}

function FunnelRow({
  label,
  value,
  pct,
  hint,
}: {
  label: string;
  value: number;
  pct: number;
  hint?: string;
}) {
  const widthPct = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{label}</span>
        <span className="font-heading text-lg font-semibold tabular-nums">
          {value.toLocaleString('pt-BR')}
        </span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full"
          style={{ width: `${widthPct}%` }}
        />
      </div>
      {hint ? (
        <span className="text-muted-foreground text-xs">{hint}</span>
      ) : null}
    </div>
  );
}

function TimeToFirstHistorySection({
  summary,
}: {
  summary: DurationSummary | null;
}) {
  return (
    <section aria-label="Tempo até a 1ª história" className="mt-6">
      <h2 className="font-heading mb-1 text-xl font-semibold tracking-tight">
        Tempo até a 1ª história
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Delta entre a criação da conta e o início da primeira história, para
        usuários que iniciaram uma nos últimos 30 dias.
      </p>
      {summary ? (
        <>
          <p className="text-muted-foreground mb-3 text-xs">
            {summary.count.toLocaleString('pt-BR')}{' '}
            {summary.count === 1 ? 'usuário' : 'usuários'} no período
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <DurationCard label="Média" valueMs={summary.avgMs} />
            <DurationCard label="Mediana" valueMs={summary.medianMs} />
            <DurationCard label="P90" valueMs={summary.p90Ms} />
            <DurationCard
              label="Mínimo"
              valueMs={summary.minMs}
              hint={`máx ${formatDurationMs(summary.maxMs)}`}
            />
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm italic">
          Sem dados de tempo até a 1ª história no período.
        </p>
      )}
    </section>
  );
}

function DurationCard({
  label,
  valueMs,
  hint,
}: {
  label: string;
  valueMs: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-semibold tabular-nums">
          {formatDurationMs(valueMs)}
        </p>
        {hint ? (
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatDurationMs(ms: number): string {
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

function StatCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number;
  accent: 'chart-1' | 'chart-2' | 'chart-3';
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-muted-foreground/70 text-xs font-normal">
          últimos 30 dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-heading text-4xl font-semibold tabular-nums',
              ACCENT_TEXT[accent]
            )}
          >
            {value.toLocaleString('pt-BR')}
          </span>
          <ArrowUpRight className="text-muted-foreground/50 size-5" />
        </div>
        {hint ? (
          <p className="text-muted-foreground mt-2 text-xs">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  points,
  accent,
}: {
  title: string;
  points: DailyPoint[];
  accent: 'chart-1' | 'chart-2' | 'chart-3';
}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const last = points.at(-1);
  const first = points[0];
  const today = last?.count ?? 0;
  const total = points.reduce((sum, p) => sum + p.count, 0);
  const range = `${first?.date ?? ''} → ${last?.date ?? ''}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="tabular-nums">
          {total.toLocaleString('pt-BR')} no total · hoje{' '}
          {today.toLocaleString('pt-BR')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-label={`${title} over the last ${points.length} days (${range})`}
          className="flex h-32 items-end gap-[2px]"
        >
          {points.map((p) => {
            const heightPct = Math.round((p.count / max) * 100);
            return (
              <div
                key={p.date}
                title={`${p.date}: ${p.count}`}
                className={cn(
                  'min-h-[2px] flex-1 rounded-sm transition-colors',
                  p.count === 0
                    ? 'bg-muted'
                    : cn(ACCENT_BG[accent], 'hover:opacity-80')
                )}
                style={{ height: `${Math.max(2, heightPct)}%` }}
              />
            );
          })}
        </div>
        <div className="text-muted-foreground mt-2 flex justify-between text-[0.65rem] tabular-nums">
          <span>{first?.date}</span>
          <span>{last?.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Keep the Stats type referenced so its shape stays part of the module's
// public contract even if the server component is the only consumer.
export type { Stats };
