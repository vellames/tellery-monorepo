import 'server-only';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionStatusFilter = 'all' | 'active' | 'completed' | 'abandoned';

import type { HistorySessionStatus } from '@prisma/client';

/** The three concrete status values a session can have (excludes the "all" filter). */
export const SESSION_STATUS_VALUES = [
  'active',
  'completed',
  'abandoned',
] as const satisfies readonly HistorySessionStatus[];

export type EventType =
  | 'session_start'
  | 'location_visited'
  | 'object_inspected'
  | 'object_message'
  | 'character_message'
  | 'clue_discovered'
  | 'llm_call'
  | 'conclusion_submitted'
  | 'session_completed';

export type TimelineEvent = {
  at: Date;
  type: EventType;
  /** Stable id used as a React key and as the final tie-breaker when sorting. */
  sortId: string;
  title: string;
  detail?: string;
  meta?: Record<string, string | number | boolean | null>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SESSIONS_PAGE_SIZE = 50;

/**
 * Secondary sort key when two events share the same timestamp. Records that are
 * written in the same `now` transaction (e.g. object inspection writes the
 * state flip, the reveal messages, and the clue discovery all with one `now`)
 * must be ordered so the narrative reads naturally: the transition happens
 * first, then the messages it produced, then the clues it surfaced.
 */
const EVENT_TYPE_ORDER: Record<EventType, number> = {
  session_start: 0,
  location_visited: 1,
  object_inspected: 2,
  character_message: 3,
  object_message: 4,
  clue_discovered: 5,
  llm_call: 6,
  conclusion_submitted: 7,
  session_completed: 8,
};

// ---------------------------------------------------------------------------
// Query payload types (derived from the include shape)
// ---------------------------------------------------------------------------

const sessionDetailInclude = {
  user: { select: { id: true, name: true, email: true, accountType: true } },
  clues: { orderBy: { discoveredAt: 'asc' } },
  characterStates: {
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  },
  objectStates: {
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  },
  locationStates: { orderBy: { createdAt: 'asc' } },
  conclusion: {
    include: {
      answers: {
        include: {
          field: { select: { label: true, type: true } },
          option: { select: { label: true } },
        },
      },
    },
  },
  ending: {
    include: {
      endingSnapshot: {
        select: { title: true, type: true, summary: true, epilogue: true },
      },
      score: true,
    },
  },
  llmCalls: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.HistorySessionInclude;

export type SessionDetail = Prisma.HistorySessionGetPayload<{
  include: typeof sessionDetailInclude;
}>;

const listSelect = {
  id: true,
  title: true,
  status: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, accountType: true } },
  // State ids are used to attribute message counts back to their session.
  characterStates: { select: { id: true } },
  objectStates: { select: { id: true } },
} satisfies Prisma.HistorySessionSelect;

export type SessionListItem = Prisma.HistorySessionGetPayload<{
  select: typeof listSelect;
}>;

/**
 * Per-session interaction counters shown in the list view. "Interactions" is
 * the number of user-visible messages (character + object, excluding the
 * hidden `system` role); "calls" is the number of LLM calls.
 */
export type SessionCounts = {
  interactions: number;
  calls: number;
  cluesDiscovered: number;
};

/**
 * What the list view actually consumes: the session row (without the internal
 * state-id arrays used only for attribution) plus the aggregated counts.
 */
export type SessionListItemWithCounts = Omit<
  SessionListItem,
  'characterStates' | 'objectStates'
> &
  SessionCounts;

// ---------------------------------------------------------------------------
// Pure helpers (tested)
// ---------------------------------------------------------------------------

/**
 * Build a single chronological timeline out of every event-bearing record in a
 * session. Records whose event timestamp is `null` (e.g. a clue that was never
 * discovered, a location never visited) are dropped — they are not events.
 *
 * Messages with `role: 'system'` (i.e. the system prompt injected into the
 * LLM) are intentionally omitted from the timeline.
 */
export function buildTimeline(session: SessionDetail): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Session start.
  events.push({
    at: session.startedAt,
    type: 'session_start',
    sortId: `start:${session.id}`,
    title: 'Sessão iniciada',
    detail: session.title,
  });

  // Location visits.
  for (const loc of session.locationStates) {
    if (!loc.visitedAt) continue;
    events.push({
      at: loc.visitedAt,
      type: 'location_visited',
      sortId: `loc:${loc.id}`,
      title: `Visitou local: ${loc.name}`,
      detail: loc.shortDescription ?? undefined,
      meta: { locationDefinitionId: loc.locationDefinitionId },
    });
  }

  // Object first-inspection.
  for (const obj of session.objectStates) {
    if (!obj.inspectedAt) continue;
    events.push({
      at: obj.inspectedAt,
      type: 'object_inspected',
      sortId: `obj:${obj.id}`,
      title: `Inspecionou objeto: ${obj.name}`,
      detail: obj.shortDescription ?? undefined,
      meta: { objectDefinitionId: obj.objectDefinitionId },
    });
  }

  // Character conversation messages (system role is hidden from the UI).
  for (const char of session.characterStates) {
    for (const msg of char.messages) {
      if (msg.role === 'system') continue;
      events.push({
        at: msg.createdAt,
        type: 'character_message',
        sortId: `cmsg:${msg.id}`,
        title: `${labelRole(msg.role)} · ${char.name}`,
        detail: msg.content,
        meta: { role: msg.role },
      });
    }
  }

  // Object interaction messages (system role is hidden from the UI).
  for (const obj of session.objectStates) {
    for (const msg of obj.messages) {
      if (msg.role === 'system') continue;
      events.push({
        at: msg.createdAt,
        type: 'object_message',
        sortId: `omsg:${msg.id}`,
        title: `${labelRole(msg.role)} · ${obj.name}`,
        detail: msg.content,
        meta: { role: msg.role },
      });
    }
  }

  // Clue discoveries.
  for (const clue of session.clues) {
    if (!clue.discoveredAt) continue;
    events.push({
      at: clue.discoveredAt,
      type: 'clue_discovered',
      sortId: `clue:${clue.id}`,
      title: `Descobriu pista: ${clue.title}`,
      detail: clue.description,
      meta: { importance: clue.importance },
    });
  }

  // LLM calls.
  for (const call of session.llmCalls) {
    events.push({
      at: call.createdAt,
      type: 'llm_call',
      sortId: `llm:${call.id}`,
      title: `Chamada LLM · ${labelPurpose(call.purpose)}`,
      detail: `modelo: ${call.model}`,
      meta: {
        purpose: call.purpose,
        modelo: call.model,
        promptTokens: call.promptTokens,
        completionTokens: call.completionTokens,
        totalTokens: call.totalTokens,
        custoUsd: nanosToUsd(call.costUsdNanos),
        latenciaMs: call.latencyMs,
        audioSegundos: call.audioSeconds,
      },
    });
  }

  // Conclusion submission.
  if (session.conclusion) {
    events.push({
      at: session.conclusion.submittedAt,
      type: 'conclusion_submitted',
      sortId: `conclusion:${session.conclusion.id}`,
      title: 'Conclusão enviada',
      meta: { respostas: session.conclusion.answers.length },
    });
  }

  // Session completion.
  if (session.completedAt) {
    events.push({
      at: session.completedAt,
      type: 'session_completed',
      sortId: `complete:${session.id}`,
      title: labelCompletion(session),
    });
  }

  return events.sort(compareTimelineEvents);
}

/**
 * Find the first event that represents a real user-driven action — i.e. not
 * the session bootstrap (`session_start`) and not background LLM processing
 * (`llm_call`, which is the backend generating content rather than the user
 * acting). Returns `null` when the session has no actions yet.
 */
export function firstUserAction(events: TimelineEvent[]): TimelineEvent | null {
  return (
    events.find((e) => e.type !== 'session_start' && e.type !== 'llm_call') ??
    null
  );
}

/**
 * Milliseconds between the session start and the first user action. `null`
 * means no action happened yet (or the start event is missing, which should
 * not occur since `buildTimeline` always emits one).
 */
export function timeToFirstAction(events: TimelineEvent[]): number | null {
  const start = events.find((e) => e.type === 'session_start');
  const first = firstUserAction(events);
  if (!start || !first) return null;
  return first.at.getTime() - start.at.getTime();
}

export function compareTimelineEvents(
  a: TimelineEvent,
  b: TimelineEvent
): number {
  if (a.at.getTime() !== b.at.getTime()) {
    return a.at.getTime() - b.at.getTime();
  }
  const byType = EVENT_TYPE_ORDER[a.type] - EVENT_TYPE_ORDER[b.type];
  if (byType !== 0) return byType;
  // Same instant, same type → keep deterministic by sortId.
  if (a.sortId < b.sortId) return -1;
  if (a.sortId > b.sortId) return 1;
  return 0;
}

function labelRole(role: string): string {
  switch (role) {
    case 'user':
      return 'Usuário';
    case 'character':
      return 'Personagem';
    case 'object':
      return 'Objeto';
    case 'system':
      return 'Sistema';
    default:
      return role;
  }
}

function labelPurpose(purpose: string): string {
  switch (purpose) {
    case 'intent':
      return 'intenção';
    case 'character':
      return 'personagem';
    case 'object':
      return 'objeto';
    case 'audio':
      return 'áudio';
    default:
      return purpose;
  }
}

function labelCompletion(session: SessionDetail): string {
  if (session.status === 'abandoned') return 'Sessão abandonada';
  return session.ending?.endingSnapshot.title
    ? `Sessão concluída · ${session.ending.endingSnapshot.title}`
    : 'Sessão concluída';
}

/**
 * Convert a BigInt nanos amount (1e9 = 1 USD) to a number in USD. Safe for
 * per-call amounts; for aggregation prefer `sumCostUsd` which sums the BigInts
 * first to preserve precision.
 */
export function nanosToUsd(nanos: bigint): number {
  return Number(nanos) / 1_000_000_000;
}

export type CostBreakdown = {
  totalUsd: number;
  totalCalls: number;
  totalTokens: number;
  byPurpose: Record<string, { calls: number; usd: number; tokens: number }>;
};

export type CostCall = {
  purpose: string;
  totalTokens: number;
  costUsdNanos: bigint;
};

/** Aggregate LLM cost of a session, grouped by `purpose`. Pure & testable. */
export function sumCostUsd(calls: CostCall[]): CostBreakdown {
  const byPurpose: CostBreakdown['byPurpose'] = {};
  let totalNanos = 0n;
  let totalTokens = 0;

  for (const call of calls) {
    totalNanos += call.costUsdNanos;
    totalTokens += call.totalTokens;
    const bucket = byPurpose[call.purpose] ?? { calls: 0, usd: 0, tokens: 0 };
    bucket.calls += 1;
    bucket.tokens += call.totalTokens;
    bucket.usd += nanosToUsd(call.costUsdNanos);
    byPurpose[call.purpose] = bucket;
  }

  return {
    totalUsd: nanosToUsd(totalNanos),
    totalCalls: calls.length,
    totalTokens,
    byPurpose,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listSessions(params: {
  page?: number;
  status?: SessionStatusFilter;
}): Promise<{
  items: SessionListItemWithCounts[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = SESSIONS_PAGE_SIZE;

  const where: Prisma.HistorySessionWhereInput = { deletedAt: null };
  if (params.status && params.status !== 'all') {
    where.status = params.status;
  }

  const [items, total] = await Promise.all([
    prisma.historySession.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.historySession.count({ where }),
  ]);

  const stateIdToSession = new Map<string, string>();
  for (const s of items) {
    for (const cs of s.characterStates) stateIdToSession.set(cs.id, s.id);
    for (const os of s.objectStates) stateIdToSession.set(os.id, s.id);
  }
  const countsById = await getSessionCounts(
    items.map((s) => s.id),
    stateIdToSession
  );

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      user: item.user,
      ...countsById[item.id],
    })),
    total,
    page,
    pageSize,
  };
}

/**
 * Aggregate interaction/call/clue counts for a set of sessions in a constant
 * number of queries (no N+1). `role: 'system'` messages are excluded so
 * interactions reflect user-visible conversation only. The
 * `stateIdToSessionId` map is required because messages reference a state
 * (character/object), not the session directly.
 */
export async function getSessionCounts(
  sessionIds: string[],
  stateIdToSessionId: Map<string, string>
): Promise<Record<string, SessionCounts>> {
  if (sessionIds.length === 0) return {};

  const [characterMessages, objectMessages, llmCalls, discoveredClues] =
    await Promise.all([
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
      prisma.llmCall.groupBy({
        by: ['sessionId'],
        where: { sessionId: { in: sessionIds } },
        _count: { _all: true },
      }),
      prisma.sessionClue.groupBy({
        by: ['sessionId'],
        where: { sessionId: { in: sessionIds }, discovered: true },
        _count: { _all: true },
      }),
    ]);

  const interactionsBySession = new Map<string, number>();
  for (const r of characterMessages) {
    const sid = stateIdToSessionId.get(r.characterStateId);
    if (sid) {
      interactionsBySession.set(
        sid,
        (interactionsBySession.get(sid) ?? 0) + r._count._all
      );
    }
  }
  for (const r of objectMessages) {
    const sid = stateIdToSessionId.get(r.objectStateId);
    if (sid) {
      interactionsBySession.set(
        sid,
        (interactionsBySession.get(sid) ?? 0) + r._count._all
      );
    }
  }

  const result: Record<string, SessionCounts> = {};
  for (const id of sessionIds) {
    result[id] = {
      interactions: interactionsBySession.get(id) ?? 0,
      calls: llmCalls.find((r) => r.sessionId === id)?._count._all ?? 0,
      cluesDiscovered:
        discoveredClues.find((r) => r.sessionId === id)?._count._all ?? 0,
    };
  }
  return result;
}

export async function getSessionDetail(
  id: string
): Promise<SessionDetail | null> {
  return prisma.historySession.findUnique({
    where: { id },
    include: sessionDetailInclude,
  });
}
