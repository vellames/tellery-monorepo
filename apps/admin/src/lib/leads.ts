import 'server-only';

import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HourlyPoint = { bucket: string; count: number };
export type SourceCount = { source: string; count: number };

export type LeadsReport = {
  windowDays: number;
  totalLeads: number;
  byHour: HourlyPoint[];
  bySource: SourceCount[];
  /** Leads whose `queryParams` did not match any known source. */
  unknown: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LEADS_WINDOW_DAYS = 7;
/** 7 days × 24 hours. */
export const LEADS_WINDOW_HOURS = LEADS_WINDOW_DAYS * 24;

export const UNKNOWN_SOURCE = 'unknown';

/**
 * Known ad sources and the (case-insensitive) substrings used to attribute a
 * lead to them. A lead is attributed to the FIRST source whose `matches` list
 * contains any substring present in `queryParams`. Order matters: list more
 * specific / higher-priority sources first.
 */
export const LEAD_SOURCES = [
  { source: 'Instagram', matches: ['utm_source=instagram', 'igshid'] },
  { source: 'TikTok', matches: ['utm_source=tiktok', 'ttclid'] },
  { source: 'Google', matches: ['utm_source=google', 'gclid'] },
  { source: 'Facebook', matches: ['utm_source=facebook', 'fbclid'] },
] as const satisfies readonly { source: string; matches: readonly string[] }[];

export type LeadSourceDef = (typeof LEAD_SOURCES)[number];

/** Structural shape accepted by the classify/build helpers (allows custom lists). */
export type SourceList = readonly {
  source: string;
  matches: readonly string[];
}[];

// ---------------------------------------------------------------------------
// Pure helpers (tested)
// ---------------------------------------------------------------------------

/**
 * Format a Date as a stable hourly bucket key in local time: `YYYY-MM-DDTHH`.
 * Two dates that fall in the same calendar hour produce the same key.
 */
export function formatLocalHour(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  return `${y}-${mo}-${d}T${h}`;
}

/**
 * Build a contiguous list of the last `hours` hourly buckets (oldest →
 * newest), each with a zero count. Used as the base series for the 7-day
 * hourly chart.
 */
export function emptyHourSeries(
  hours: number,
  now = new Date()
): HourlyPoint[] {
  const series: HourlyPoint[] = [];
  // Anchor to the top of the current hour, then walk back.
  const cursor = new Date(now);
  cursor.setMinutes(0, 0, 0);
  for (let offset = hours - 1; offset >= 0; offset -= 1) {
    const d = new Date(cursor.getTime() - offset * 60 * 60 * 1000);
    series.push({ bucket: formatLocalHour(d), count: 0 });
  }
  return series;
}

/**
 * Count records per hourly bucket into an existing series (mutating it).
 * Records outside the series window are ignored.
 */
export function fillHourSeries(
  series: HourlyPoint[],
  dates: Date[]
): HourlyPoint[] {
  const indexByBucket = new Map(series.map((p, i) => [p.bucket, i]));
  for (const raw of dates) {
    const key = formatLocalHour(raw);
    const i = indexByBucket.get(key);
    if (i !== undefined) {
      series[i].count += 1;
    }
  }
  return series;
}

/**
 * Attribute a single lead's `queryParams` to the first matching source.
 * Returns `UNKNOWN_SOURCE` when nothing matches or when the query string is
 * null/empty. Matching is case-insensitive on the raw query string.
 */
export function classifySource(
  queryParams: string | null | undefined,
  sources: SourceList = LEAD_SOURCES
): string {
  if (!queryParams) return UNKNOWN_SOURCE;
  const haystack = queryParams.toLowerCase();
  for (const def of sources) {
    if (def.matches.some((m) => haystack.includes(m.toLowerCase()))) {
      return def.source;
    }
  }
  return UNKNOWN_SOURCE;
}

/**
 * Aggregate a list of leads into per-source counts. Returns sources sorted by
 * count desc, followed by `unknown` (always last). The `unknown` count is also
 * returned separately for convenience.
 */
export function buildSourceCounts(
  queryParamsList: Array<string | null | undefined>,
  sources: SourceList = LEAD_SOURCES
): { bySource: SourceCount[]; unknown: number } {
  const counts = new Map<string, number>();
  let unknown = 0;
  for (const qp of queryParamsList) {
    const source = classifySource(qp, sources);
    if (source === UNKNOWN_SOURCE) {
      unknown += 1;
    } else {
      counts.set(source, (counts.get(source) ?? 0) + 1);
    }
  }

  const bySource: SourceCount[] = [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return { bySource, unknown };
}

/**
 * Start of the current hour shifted back by `hours - 1` hours, i.e. the
 * inclusive lower bound for the window.
 */
export function hourWindowStart(hours: number, now = new Date()): Date {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  return new Date(start.getTime() - (hours - 1) * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getLeadsReport(): Promise<LeadsReport> {
  const windowDays = LEADS_WINDOW_DAYS;
  const hours = LEADS_WINDOW_HOURS;
  const since = hourWindowStart(hours);

  const leads = await prisma.lead.findMany({
    select: { createdAt: true, queryParams: true },
    where: { deletedAt: null, createdAt: { gte: since } },
  });

  const byHour = fillHourSeries(
    emptyHourSeries(hours),
    leads.map((l) => l.createdAt)
  );
  const { bySource, unknown } = buildSourceCounts(
    leads.map((l) => l.queryParams)
  );

  return {
    windowDays,
    totalLeads: leads.length,
    byHour,
    bySource,
    unknown,
  };
}
