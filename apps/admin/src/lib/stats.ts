import 'server-only';

import { prisma } from '@/lib/prisma';

// Look-back window for the dashboard: last N days, inclusive of "today".
export const STATS_WINDOW_DAYS = 30;

export type DailyPoint = { date: string; count: number };

export type Stats = {
  windowDays: number;
  totals: { leads: number; users: number; sessions: number };
  byDay: { leads: DailyPoint[]; users: DailyPoint[]; sessions: DailyPoint[] };
};

/**
 * Format a Date as a `YYYY-MM-DD` string using the local timezone (matches how
 * Prisma returns `createdAt`). Grouping in local time keeps the dashboard
 * intuitive for the operator.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Build a contiguous list of the last `days` dates (oldest → newest), each with
 * a zero count. The result always has exactly `days` entries and acts as the
 * base series onto which observed records are folded.
 */
export function emptyDaySeries(days: number, today = new Date()): DailyPoint[] {
  const series: DailyPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    series.push({ date: formatLocalDate(d), count: 0 });
  }
  return series;
}

/**
 * Count records per `YYYY-MM-DD` into an existing series (mutating it). Records
 * outside the series window are ignored. Records are expected to be only the
 * `createdAt` timestamps returned by the Prisma query.
 */
export function fillDaySeries(
  series: DailyPoint[],
  createdAtDates: Date[]
): DailyPoint[] {
  const indexByDate = new Map(series.map((p, i) => [p.date, i]));
  for (const raw of createdAtDates) {
    const key = formatLocalDate(raw);
    const i = indexByDate.get(key);
    if (i !== undefined) {
      series[i].count += 1;
    }
  }
  return series;
}

/**
 * Start of the current day shifted back by `days - 1` days, i.e. the inclusive
 * lower bound for the window (e.g. days=30 → the last 30 days including today).
 */
export function windowStart(days: number, now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

// ---------------------------------------------------------------------------
// Conversion funnel
// ---------------------------------------------------------------------------

export type ConversionFunnel = {
  windowDays: number;
  leads: number;
  convertedLeads: number;
  temporaryUsers: number;
  permanentUsers: number;
  usersStartedStory: number;
  /** Share of users (created in window) who started at least one history. */
  startedStoryRate: number;
  /**
   * Time between account creation and the user's FIRST history session, for
   * users who started one within the window. `null` when nobody started.
   */
  timeToFirstStory: DurationSummary | null;
  /** Distribution of interaction counts across sessions started in the window. */
  interactionBuckets: {
    zero: number;
    atLeast1: number;
    atLeast10: number;
    atLeast20: number;
  };
};

export type DurationSummary = {
  count: number;
  /** Arithmetic mean of the deltas, in milliseconds. */
  avgMs: number;
  /** 50th percentile, in milliseconds. */
  medianMs: number;
  /** 90th percentile, in milliseconds. */
  p90Ms: number;
  /** Minimum delta observed, in milliseconds. */
  minMs: number;
  /** Maximum delta observed, in milliseconds. */
  maxMs: number;
};

/**
 * Aggregate a list of durations (in ms) into avg / median / p90 / min / max.
 * Mutates the input array for the sort step — callers usually pass a fresh
 * array. Pure & tested.
 */
export function summarizeDeltasMs(deltasMs: number[]): DurationSummary | null {
  if (deltasMs.length === 0) return null;
  const sorted = [...deltasMs].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  return {
    count: sorted.length,
    avgMs: sum / sorted.length,
    medianMs: percentile(sorted, 0.5),
    p90Ms: percentile(sorted, 0.9),
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
  };
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  // Nearest-rank method (matches common BI tool defaults).
  const rank = Math.ceil(p * sortedAsc.length);
  const idx = Math.min(sortedAsc.length, Math.max(1, rank)) - 1;
  return sortedAsc[idx];
}

export type InteractionBucketKey = keyof ConversionFunnel['interactionBuckets'];

export const INTERACTION_THRESHOLDS = {
  zero: 0,
  atLeast1: 1,
  atLeast10: 10,
  atLeast20: 20,
} as const satisfies Record<InteractionBucketKey, number>;

/**
 * Classify a per-session interaction count into a single bucket. Used by
 * `buildInteractionBuckets` which sums these flags across all sessions.
 * Pure & tested.
 */
export function classifyInteractionCount(count: number): {
  zero: 0 | 1;
  atLeast1: 0 | 1;
  atLeast10: 0 | 1;
  atLeast20: 0 | 1;
} {
  return {
    zero: count <= INTERACTION_THRESHOLDS.zero ? 1 : 0,
    atLeast1: count >= INTERACTION_THRESHOLDS.atLeast1 ? 1 : 0,
    atLeast10: count >= INTERACTION_THRESHOLDS.atLeast10 ? 1 : 0,
    atLeast20: count >= INTERACTION_THRESHOLDS.atLeast20 ? 1 : 0,
  };
}

/**
 * Aggregate per-session interaction counts into the four buckets. Each session
 * is counted in every bucket whose threshold it meets (so the buckets overlap
 * by design — e.g. a session with 25 interactions is in atLeast1, atLeast10,
 * AND atLeast20). Pure & tested.
 */
export function buildInteractionBuckets(
  counts: number[]
): ConversionFunnel['interactionBuckets'] {
  const acc = { zero: 0, atLeast1: 0, atLeast10: 0, atLeast20: 0 };
  for (const count of counts) {
    const c = classifyInteractionCount(count);
    acc.zero += c.zero;
    acc.atLeast1 += c.atLeast1;
    acc.atLeast10 += c.atLeast10;
    acc.atLeast20 += c.atLeast20;
  }
  return acc;
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export async function getConversionFunnel(): Promise<ConversionFunnel> {
  const days = STATS_WINDOW_DAYS;
  const since = windowStart(days);

  const notDeleted = { deletedAt: null };
  const createdInRange = { gte: since };

  // Funnel counts (all users/leads created in the window).
  const [leads, convertedLeads, temporaryUsers, permanentUsers, usersTotal] =
    await Promise.all([
      prisma.lead.count({
        where: { ...notDeleted, createdAt: createdInRange },
      }),
      prisma.lead.count({
        where: {
          ...notDeleted,
          createdAt: createdInRange,
          userId: { not: null },
        },
      }),
      prisma.user.count({
        where: {
          ...notDeleted,
          createdAt: createdInRange,
          accountType: 'temporary',
        },
      }),
      prisma.user.count({
        where: {
          ...notDeleted,
          createdAt: createdInRange,
          accountType: 'permanent',
        },
      }),
      prisma.user.count({
        where: { ...notDeleted, createdAt: createdInRange },
      }),
    ]);

  // Sessions started in the window — needed both for "users who started a
  // history" (distinct userIds), for the interaction buckets (per-session),
  // and for the time-to-first-history delta (createdAt → startedAt).
  const sessionsInWindow = await prisma.storySession.findMany({
    select: { id: true, userId: true, startedAt: true },
    where: { ...notDeleted, createdAt: createdInRange },
  });
  const distinctUsersStarted = new Set(sessionsInWindow.map((s) => s.userId));
  const usersStartedStory = distinctUsersStarted.size;

  // For each user who started a history in the window, find their earliest
  // session's startedAt — that's their "first history" timestamp regardless of
  // whether the session itself was created inside the window.
  const firstStartedAtByUser = new Map<string, Date>();
  for (const s of sessionsInWindow) {
    const current = firstStartedAtByUser.get(s.userId);
    if (!current || s.startedAt.getTime() < current.getTime()) {
      firstStartedAtByUser.set(s.userId, s.startedAt);
    }
  }

  // Look up account creation for those users, then compute the deltas.
  const usersWhoStarted = await prisma.user.findMany({
    select: { id: true, createdAt: true },
    where: { id: { in: [...distinctUsersStarted] } },
  });
  const deltasMs: number[] = [];
  for (const u of usersWhoStarted) {
    const firstStarted = firstStartedAtByUser.get(u.id);
    if (!firstStarted) continue;
    const delta = firstStarted.getTime() - u.createdAt.getTime();
    if (delta >= 0) deltasMs.push(delta);
  }
  const timeToFirstStory = summarizeDeltasMs(deltasMs);

  // Count non-system messages per session, then bucketize.
  const sessionIds = sessionsInWindow.map((s) => s.id);
  const interactionsBySession = await getInteractionCountsBySession(sessionIds);
  const counts = sessionIds.map((id) => interactionsBySession.get(id) ?? 0);

  return {
    windowDays: days,
    leads,
    convertedLeads,
    temporaryUsers,
    permanentUsers,
    usersStartedStory,
    startedStoryRate: rate(usersStartedStory, usersTotal),
    timeToFirstStory,
    interactionBuckets: buildInteractionBuckets(counts),
  };
}

/**
 * For a set of sessions, return a map `sessionId → interaction count`, where
 * "interaction" = non-system character + object messages. Constant number of
 * queries regardless of how many sessions are passed (no N+1).
 */
export async function getInteractionCountsBySession(
  sessionIds: string[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (sessionIds.length === 0) return result;

  const [characterMessages, objectMessages] = await Promise.all([
    prisma.characterConversationMessage.groupBy({
      by: ['characterStateId'],
      where: {
        role: { not: 'system' },
        characterState: { sessionId: { in: sessionIds } },
      },
      _count: { _all: true },
    }),
    prisma.objectInteractionMessage.groupBy({
      by: ['objectStateId'],
      where: {
        role: { not: 'system' },
        objectState: { sessionId: { in: sessionIds } },
      },
      _count: { _all: true },
    }),
  ]);

  // Resolve state FKs back to sessions.
  const stateIds = new Set<string>([
    ...characterMessages.map((r) => r.characterStateId),
    ...objectMessages.map((r) => r.objectStateId),
  ]);
  const stateIdToSession = await mapStateIdsToSessions(sessionIds, stateIds);

  for (const r of characterMessages) {
    const sid = stateIdToSession.get(r.characterStateId);
    if (sid) result.set(sid, (result.get(sid) ?? 0) + r._count._all);
  }
  for (const r of objectMessages) {
    const sid = stateIdToSession.get(r.objectStateId);
    if (sid) result.set(sid, (result.get(sid) ?? 0) + r._count._all);
  }
  return result;
}

async function mapStateIdsToSessions(
  sessionIds: string[],
  stateIds: Set<string>
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (stateIds.size === 0) return result;
  const sessions = await prisma.storySession.findMany({
    where: { id: { in: sessionIds } },
    select: {
      id: true,
      characterStates: { select: { id: true } },
      objectStates: { select: { id: true } },
    },
  });
  for (const s of sessions) {
    for (const cs of s.characterStates) result.set(cs.id, s.id);
    for (const os of s.objectStates) result.set(os.id, s.id);
  }
  return result;
}

export async function get30DayStats(): Promise<Stats> {
  const days = STATS_WINDOW_DAYS;
  const since = windowStart(days);

  const notDeleted = { deletedAt: null };
  const createdInRange = { gte: since };

  const [
    leadsTotal,
    usersTotal,
    sessionsTotal,
    leadDates,
    userDates,
    sessionDates,
  ] = await Promise.all([
    prisma.lead.count({ where: { ...notDeleted, createdAt: createdInRange } }),
    prisma.user.count({ where: { ...notDeleted, createdAt: createdInRange } }),
    prisma.storySession.count({
      where: { ...notDeleted, createdAt: createdInRange },
    }),
    prisma.lead.findMany({
      select: { createdAt: true },
      where: { ...notDeleted, createdAt: createdInRange },
    }),
    prisma.user.findMany({
      select: { createdAt: true },
      where: { ...notDeleted, createdAt: createdInRange },
    }),
    prisma.storySession.findMany({
      select: { createdAt: true },
      where: { ...notDeleted, createdAt: createdInRange },
    }),
  ]);

  return {
    windowDays: days,
    totals: {
      leads: leadsTotal,
      users: usersTotal,
      sessions: sessionsTotal,
    },
    byDay: {
      leads: fillDaySeries(
        emptyDaySeries(days),
        leadDates.map((r) => r.createdAt)
      ),
      users: fillDaySeries(
        emptyDaySeries(days),
        userDates.map((r) => r.createdAt)
      ),
      sessions: fillDaySeries(
        emptyDaySeries(days),
        sessionDates.map((r) => r.createdAt)
      ),
    },
  };
}
