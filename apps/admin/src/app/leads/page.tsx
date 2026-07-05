import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getLeadsReport,
  UNKNOWN_SOURCE,
  type HourlyPoint,
  type LeadsReport,
  type SourceCount,
} from '@/lib/leads';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadsPage() {
  const report = await getLeadsReport();
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-1">
        <span className="font-heading text-gold-foreground text-sm font-medium tracking-wide uppercase">
          Análise de Leads
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Leads por source
        </h1>
        <p className="text-muted-foreground text-sm">
          Últimos {report.windowDays} dias · até {todayLabel} ·{' '}
          {report.totalLeads.toLocaleString('pt-BR')} leads
        </p>
      </header>

      <HourlyChartCard points={report.byHour} windowDays={report.windowDays} />

      <SourceBreakdownCard
        bySource={report.bySource}
        unknown={report.unknown}
        total={report.totalLeads}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Hourly chart (168 bars)
// ---------------------------------------------------------------------------

function HourlyChartCard({
  points,
  windowDays,
}: {
  points: HourlyPoint[];
  windowDays: number;
}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((sum, p) => sum + p.count, 0);

  // Markers at the start of each day: every 24th bucket (one per day).
  const dayMarkers: { label: string; index: number }[] = [];
  for (let i = 0; i < points.length; i += 24) {
    const date = new Date(points[i].bucket + ':00:00');
    dayMarkers.push({
      label: date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
      }),
      index: i,
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Leads por hora</CardTitle>
        <CardDescription className="tabular-nums">
          {total.toLocaleString('pt-BR')} leads nas últimas {windowDays * 24}h (
          {windowDays} dias)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-[1px]">
          {points.map((p, i) => {
            const heightPct = Math.round((p.count / max) * 100);
            return (
              <div
                key={p.bucket}
                title={`${formatHourTooltip(p.bucket)}: ${p.count} lead${p.count === 1 ? '' : 's'}`}
                className={cn(
                  'min-h-[2px] flex-1 rounded-sm transition-colors',
                  p.count === 0 ? 'bg-muted' : 'bg-chart-1 hover:opacity-80'
                )}
                style={{ height: `${Math.max(2, heightPct)}%` }}
                data-day-start={
                  dayMarkers.some((m) => m.index === i) ? 'true' : undefined
                }
              />
            );
          })}
        </div>
        <div className="text-muted-foreground/70 mt-2 flex justify-between text-[0.65rem] tabular-nums">
          {dayMarkers.map((m) => (
            <span key={m.index}>{m.label}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatHourTooltip(bucket: string): string {
  // bucket is "YYYY-MM-DDTHH"; pad to a parseable ISO datetime.
  const d = new Date(bucket + ':00:00');
  return d.toLocaleString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Source breakdown
// ---------------------------------------------------------------------------

function SourceBreakdownCard({
  bySource,
  unknown,
  total,
}: {
  bySource: SourceCount[];
  unknown: number;
  total: number;
}) {
  const rows = [...bySource];
  if (unknown > 0) {
    rows.push({ source: UNKNOWN_SOURCE, count: unknown });
  }
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por source</CardTitle>
        <CardDescription>
          Atribuição por <code className="font-mono">utm_source</code> e click
          IDs (gclid, fbclid, ttclid, igshid) no query param. Match parcial,
          case-insensitive.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            Nenhum lead no período.
          </p>
        ) : (
          rows.map((row) => {
            const pct = total > 0 ? (row.count / total) * 100 : 0;
            const widthPct = Math.round((row.count / maxCount) * 100);
            const label =
              row.source === UNKNOWN_SOURCE
                ? 'Outros / desconhecido'
                : row.source;
            return (
              <div key={row.source} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm tabular-nums">
                    <span className="font-semibold">
                      {row.count.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}
                      · {pct.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      row.source === UNKNOWN_SOURCE
                        ? 'bg-muted-foreground/50'
                        : 'bg-primary'
                    )}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// Keep the report type referenced for module contract purposes.
export type { LeadsReport };
