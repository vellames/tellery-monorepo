import { describe, expect, it } from 'vitest';

import {
  buildTimeline,
  compareTimelineEvents,
  firstUserAction,
  nanosToUsd,
  sumCostUsd,
  timeToFirstAction,
  type SessionDetail,
  type TimelineEvent,
} from '@/lib/sessions';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseSession: SessionDetail = {
  id: 'session-1',
  createdAt: new Date('2026-07-05T10:00:00Z'),
  updatedAt: new Date('2026-07-05T10:00:00Z'),
  deletedAt: null,
  userId: 'user-1',
  storyId: 'story-1',
  title: 'The Manor Mystery',
  subtitle: null,
  teaser: '',
  opening: '',
  objective: '',
  genre: 'mystery',
  coverImageUrl: null,
  thumbnailUrl: null,
  estimatedDurationMinutes: 30,
  status: 'completed',
  startedAt: new Date('2026-07-05T10:00:00Z'),
  completedAt: new Date('2026-07-05T11:30:00Z'),
  user: {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@test',
    accountType: 'permanent',
  },
  clues: [],
  characterStates: [],
  objectStates: [],
  locationStates: [],
  conclusion: null,
  ending: null,
  llmCalls: [],
};

function makeEvent(overrides: Partial<TimelineEvent>): TimelineEvent {
  return {
    at: new Date('2026-07-05T10:00:00Z'),
    type: 'llm_call',
    sortId: 'id',
    title: 'title',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// compareTimelineEvents
// ---------------------------------------------------------------------------

describe('compareTimelineEvents', () => {
  it('orders by timestamp ascending', () => {
    const earlier = makeEvent({
      at: new Date('2026-07-05T10:00:00Z'),
      sortId: 'a',
    });
    const later = makeEvent({
      at: new Date('2026-07-05T10:00:01Z'),
      sortId: 'b',
    });
    expect([later, earlier].sort(compareTimelineEvents)).toEqual([
      earlier,
      later,
    ]);
  });

  it('breaks ties by event-type order (transition before message before clue)', () => {
    const sameInstant = new Date('2026-07-05T10:05:00Z');
    const clue = makeEvent({
      at: sameInstant,
      type: 'clue_discovered',
      sortId: 's-1',
    });
    const message = makeEvent({
      at: sameInstant,
      type: 'object_message',
      sortId: 's-2',
    });
    const transition = makeEvent({
      at: sameInstant,
      type: 'object_inspected',
      sortId: 's-3',
    });

    const sorted = [clue, message, transition].sort(compareTimelineEvents);
    expect(sorted.map((e) => e.type)).toEqual([
      'object_inspected',
      'object_message',
      'clue_discovered',
    ]);
  });

  it('breaks remaining ties by sortId', () => {
    const sameInstant = new Date('2026-07-05T10:05:00Z');
    const a = makeEvent({ at: sameInstant, type: 'llm_call', sortId: 'z' });
    const b = makeEvent({ at: sameInstant, type: 'llm_call', sortId: 'a' });
    expect([a, b].sort(compareTimelineEvents)).toEqual([b, a]);
  });
});

// ---------------------------------------------------------------------------
// buildTimeline
// ---------------------------------------------------------------------------

describe('buildTimeline', () => {
  it('always starts with a session_start event', () => {
    const events = buildTimeline(baseSession);
    expect(events[0].type).toBe('session_start');
    expect(events[0].at).toEqual(baseSession.startedAt);
  });

  it('drops location/object/clue rows whose event timestamp is null', () => {
    const session: SessionDetail = {
      ...baseSession,
      status: 'active',
      completedAt: null,
      locationStates: [
        {
          id: 'loc-1',
          createdAt: baseSession.createdAt,
          updatedAt: baseSession.createdAt,
          deletedAt: null,
          sessionId: baseSession.id,
          locationDefinitionId: 'loc-def-1',
          name: 'Library',
          shortDescription: 'A quiet library.',
          imageUrl: null,
          initialDescription: '',
          visited: false,
          visitedAt: null,
        },
      ],
      objectStates: [
        {
          id: 'obj-1',
          createdAt: baseSession.createdAt,
          updatedAt: baseSession.createdAt,
          deletedAt: null,
          sessionId: baseSession.id,
          locationStateId: null,
          objectDefinitionId: 'obj-def-1',
          name: 'Rusty Key',
          shortDescription: 'A rusty key.',
          imageUrl: null,
          initialDescription: '',
          inspected: false,
          inspectedAt: null,
          messages: [],
        },
      ],
      clues: [
        {
          id: 'clue-1',
          createdAt: baseSession.createdAt,
          updatedAt: baseSession.createdAt,
          deletedAt: null,
          sessionId: baseSession.id,
          clueDefinitionId: 'clue-def-1',
          title: 'Bloody cloth',
          description: 'A bloody cloth.',
          importance: 'required',
          discovered: false,
          discoveredAt: null,
        },
      ],
    };

    const events = buildTimeline(session);
    // Only the session_start event should be present.
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('session_start');
  });

  it('emits events for discovered clues, visited locations, inspected objects', () => {
    const at = new Date('2026-07-05T10:10:00Z');
    const session: SessionDetail = {
      ...baseSession,
      locationStates: [
        {
          id: 'loc-1',
          createdAt: baseSession.createdAt,
          updatedAt: at,
          deletedAt: null,
          sessionId: baseSession.id,
          locationDefinitionId: 'loc-def-1',
          name: 'Library',
          shortDescription: 'A quiet library.',
          imageUrl: null,
          initialDescription: '',
          visited: true,
          visitedAt: at,
        },
      ],
      objectStates: [
        {
          id: 'obj-1',
          createdAt: baseSession.createdAt,
          updatedAt: at,
          deletedAt: null,
          sessionId: baseSession.id,
          locationStateId: null,
          objectDefinitionId: 'obj-def-1',
          name: 'Rusty Key',
          shortDescription: 'A rusty key.',
          imageUrl: null,
          initialDescription: '',
          inspected: true,
          inspectedAt: at,
          messages: [],
        },
      ],
      clues: [
        {
          id: 'clue-1',
          createdAt: baseSession.createdAt,
          updatedAt: at,
          deletedAt: null,
          sessionId: baseSession.id,
          clueDefinitionId: 'clue-def-1',
          title: 'Bloody cloth',
          description: 'A bloody cloth.',
          importance: 'required',
          discovered: true,
          discoveredAt: at,
        },
      ],
    };

    const types = buildTimeline(session).map((e) => e.type);
    expect(types).toContain('location_visited');
    expect(types).toContain('object_inspected');
    expect(types).toContain('clue_discovered');
  });

  it('interleaves character messages, object messages and llm calls by time', () => {
    const t1 = new Date('2026-07-05T10:10:00.000Z');
    const t2 = new Date('2026-07-05T10:10:00.002Z');
    const t3 = new Date('2026-07-05T10:10:00.001Z');
    const session: SessionDetail = {
      ...baseSession,
      characterStates: [
        {
          id: 'char-1',
          createdAt: baseSession.createdAt,
          updatedAt: baseSession.createdAt,
          deletedAt: null,
          sessionId: baseSession.id,
          characterDefinitionId: 'char-def-1',
          name: 'Detective Rowe',
          role: 'character',
          shortDescription: '',
          imageUrl: null,
          personality: '',
          speakingStyle: '',
          openingLine: '',
          publicKnowledge: [],
          privateKnowledge: [],
          conversationBoundaries: [],
          conversationSummary: null,
          messages: [
            {
              id: 'cmsg-1',
              createdAt: t2,
              characterStateId: 'char-1',
              role: 'character',
              content: 'I was in the library.',
            },
          ],
        },
      ],
      objectStates: [
        {
          id: 'obj-1',
          createdAt: baseSession.createdAt,
          updatedAt: baseSession.createdAt,
          deletedAt: null,
          sessionId: baseSession.id,
          locationStateId: null,
          objectDefinitionId: 'obj-def-1',
          name: 'Rusty Key',
          shortDescription: '',
          imageUrl: null,
          initialDescription: '',
          inspected: false,
          inspectedAt: null,
          messages: [
            {
              id: 'omsg-1',
              createdAt: t1,
              objectStateId: 'obj-1',
              role: 'object',
              content: 'The key is cold to the touch.',
            },
          ],
        },
      ],
      llmCalls: [
        {
          id: 'llm-1',
          createdAt: t3,
          sessionId: baseSession.id,
          purpose: 'character',
          model: 'gpt-x',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costUsdNanos: 150_000_000n,
          latencyMs: 800,
          audioSeconds: null,
        },
      ],
    };

    const events = buildTimeline(session).filter(
      (e) => e.type !== 'session_start' && e.type !== 'session_completed'
    );
    // Order should follow t1 (object_message) → t3 (llm_call) → t2 (character_message).
    expect(events.map((e) => e.type)).toEqual([
      'object_message',
      'llm_call',
      'character_message',
    ]);
  });

  it('omits messages whose role is "system" (the system prompt)', () => {
    const at = new Date('2026-07-05T10:10:00Z');
    const session: SessionDetail = {
      ...baseSession,
      status: 'active',
      completedAt: null,
      characterStates: [
        {
          id: 'char-1',
          createdAt: baseSession.createdAt,
          updatedAt: baseSession.createdAt,
          deletedAt: null,
          sessionId: baseSession.id,
          characterDefinitionId: 'char-def-1',
          name: 'Detective Rowe',
          role: 'character',
          shortDescription: '',
          imageUrl: null,
          personality: '',
          speakingStyle: '',
          openingLine: '',
          publicKnowledge: [],
          privateKnowledge: [],
          conversationBoundaries: [],
          conversationSummary: null,
          messages: [
            {
              id: 'cmsg-sys',
              createdAt: at,
              characterStateId: 'char-1',
              role: 'system',
              content: 'You are a detective mystery game master.',
            },
            {
              id: 'cmsg-user',
              createdAt: new Date(at.getTime() + 1),
              characterStateId: 'char-1',
              role: 'user',
              content: 'Tell me about the library.',
            },
          ],
        },
      ],
    };

    const msgs = buildTimeline(session).filter(
      (e) => e.type === 'character_message' || e.type === 'object_message'
    );
    // Only the non-system message should appear.
    expect(msgs).toHaveLength(1);
    expect(msgs[0].meta?.role).toBe('user');
  });

  it('appends a session_completed event when completedAt is set', () => {
    const events = buildTimeline(baseSession);
    const last = events.at(-1);
    expect(last?.type).toBe('session_completed');
    expect(last?.at).toEqual(baseSession.completedAt);
  });

  it('does not append session_completed when completedAt is null', () => {
    const session: SessionDetail = {
      ...baseSession,
      status: 'active',
      completedAt: null,
    };
    const events = buildTimeline(session);
    expect(events.some((e) => e.type === 'session_completed')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cost helpers
// ---------------------------------------------------------------------------

describe('nanosToUsd', () => {
  it('converts nanos to USD (1e9 = 1 USD)', () => {
    expect(nanosToUsd(1_000_000_000n)).toBe(1);
    expect(nanosToUsd(150_000_000n)).toBeCloseTo(0.15, 9);
    expect(nanosToUsd(0n)).toBe(0);
  });
});

describe('sumCostUsd', () => {
  it('aggregates total and per-purpose buckets, summing BigInts first', () => {
    const breakdown = sumCostUsd([
      { purpose: 'character', totalTokens: 150, costUsdNanos: 150_000_000n },
      { purpose: 'character', totalTokens: 100, costUsdNanos: 100_000_000n },
      { purpose: 'intent', totalTokens: 50, costUsdNanos: 25_000_000n },
    ]);

    expect(breakdown.totalCalls).toBe(3);
    expect(breakdown.totalTokens).toBe(300);
    expect(breakdown.totalUsd).toBeCloseTo(0.275, 9);
    expect(breakdown.byPurpose['character']).toEqual({
      calls: 2,
      usd: 0.25,
      tokens: 250,
    });
    expect(breakdown.byPurpose['intent']).toEqual({
      calls: 1,
      usd: 0.025,
      tokens: 50,
    });
  });

  it('returns zeros for an empty list', () => {
    const breakdown = sumCostUsd([]);
    expect(breakdown).toEqual({
      totalUsd: 0,
      totalCalls: 0,
      totalTokens: 0,
      byPurpose: {},
    });
  });
});

// ---------------------------------------------------------------------------
// firstUserAction / timeToFirstAction
// ---------------------------------------------------------------------------

describe('firstUserAction', () => {
  const startAt = new Date('2026-07-05T10:00:00.000Z');
  const actionAt = new Date('2026-07-05T10:00:45.000Z');
  const llmAt = new Date('2026-07-05T10:00:30.000Z');

  function makeEvents(
    types: Array<{ type: TimelineEvent['type']; at: Date; sortId: string }>
  ): TimelineEvent[] {
    return types.map((t) => ({
      at: t.at,
      type: t.type,
      sortId: t.sortId,
      title: t.type,
    }));
  }

  it('returns the first non-start, non-llm event by time', () => {
    const events = makeEvents([
      { type: 'session_start', at: startAt, sortId: 's' },
      { type: 'llm_call', at: llmAt, sortId: 'l' },
      { type: 'object_inspected', at: actionAt, sortId: 'a' },
    ]);
    const first = firstUserAction(events);
    expect(first?.type).toBe('object_inspected');
  });

  it('returns null when only session_start and llm_call are present', () => {
    const events = makeEvents([
      { type: 'session_start', at: startAt, sortId: 's' },
      { type: 'llm_call', at: llmAt, sortId: 'l' },
    ]);
    expect(firstUserAction(events)).toBeNull();
  });

  it('returns null for an empty timeline', () => {
    expect(firstUserAction([])).toBeNull();
  });
});

describe('timeToFirstAction', () => {
  it('returns ms between session_start and first user action', () => {
    const events: TimelineEvent[] = [
      {
        at: new Date('2026-07-05T10:00:00Z'),
        type: 'session_start',
        sortId: 's',
        title: 'start',
      },
      {
        at: new Date('2026-07-05T10:00:30Z'),
        type: 'llm_call',
        sortId: 'l',
        title: 'llm',
      },
      {
        at: new Date('2026-07-05T10:01:15Z'),
        type: 'object_inspected',
        sortId: 'a',
        title: 'act',
      },
    ];
    // 75s = 75000ms
    expect(timeToFirstAction(events)).toBe(75_000);
  });

  it('returns null when there is no user action', () => {
    const events: TimelineEvent[] = [
      {
        at: new Date('2026-07-05T10:00:00Z'),
        type: 'session_start',
        sortId: 's',
        title: 'start',
      },
      {
        at: new Date('2026-07-05T10:00:30Z'),
        type: 'llm_call',
        sortId: 'l',
        title: 'llm',
      },
    ];
    expect(timeToFirstAction(events)).toBeNull();
  });
});
