import { describe, expect, it } from 'vitest';

import {
  buildInteractionBuckets,
  classifyInteractionCount,
  emptyDaySeries,
  fillDaySeries,
  formatLocalDate,
  STATS_WINDOW_DAYS,
  summarizeDeltasMs,
  windowStart,
} from '@/lib/stats';

describe('formatLocalDate', () => {
  it('formats a date as YYYY-MM-DD with zero padding', () => {
    expect(formatLocalDate(new Date(2026, 6, 5))).toBe('2026-07-05');
    expect(formatLocalDate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});

describe('windowStart', () => {
  it('returns midnight of (today - (days - 1))', () => {
    const now = new Date(2026, 6, 5, 17, 30, 0);
    const start = windowStart(STATS_WINDOW_DAYS, now);
    expect(start).toEqual(new Date(2026, 5, 6, 0, 0, 0, 0));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it('for days=1 returns the start of the same day', () => {
    const now = new Date(2026, 6, 5, 17, 30, 0);
    expect(windowStart(1, now)).toEqual(new Date(2026, 6, 5, 0, 0, 0, 0));
  });
});

describe('emptyDaySeries', () => {
  it('produces exactly `days` contiguous dates oldest → newest, all zero', () => {
    const today = new Date(2026, 6, 5);
    const series = emptyDaySeries(STATS_WINDOW_DAYS, today);

    expect(series).toHaveLength(STATS_WINDOW_DAYS);
    expect(series.every((p) => p.count === 0)).toBe(true);

    // First entry is the oldest day in the window.
    expect(series[0].date).toBe('2026-06-06');
    // Last entry is "today".
    expect(series.at(-1)?.date).toBe('2026-07-05');

    // Contiguity: each date is exactly one day after the previous.
    for (let i = 1; i < series.length; i += 1) {
      const prev = new Date(series[i - 1].date);
      const curr = new Date(series[i].date);
      const dayMs = 24 * 60 * 60 * 1000;
      expect(curr.getTime() - prev.getTime()).toBe(dayMs);
    }
  });
});

describe('fillDaySeries', () => {
  it('counts records per day and ignores out-of-window dates', () => {
    const today = new Date(2026, 6, 5);
    const series = emptyDaySeries(STATS_WINDOW_DAYS, today);

    // Two records on "today", one 3 days ago, one far outside the window.
    const dates = [
      new Date(2026, 6, 5, 10, 0, 0),
      new Date(2026, 6, 5, 22, 30, 0),
      new Date(2026, 6, 2, 8, 15, 0),
      new Date(2025, 0, 1, 0, 0, 0), // out of window
    ];

    fillDaySeries(series, dates);

    const byDate = new Map(series.map((p) => [p.date, p.count]));
    expect(byDate.get('2026-07-05')).toBe(2);
    expect(byDate.get('2026-07-02')).toBe(1);
    // Out-of-window record did not land anywhere countable.
    expect(series.reduce((sum, p) => sum + p.count, 0)).toBe(3);
  });

  it('does not mutate the series length', () => {
    const today = new Date(2026, 6, 5);
    const series = emptyDaySeries(STATS_WINDOW_DAYS, today);
    const before = series.length;
    fillDaySeries(series, [new Date(2026, 6, 5)]);
    expect(series).toHaveLength(before);
  });
});

// ---------------------------------------------------------------------------
// Conversion funnel — pure helpers
// ---------------------------------------------------------------------------

describe('classifyInteractionCount', () => {
  it('classifies zero interactions', () => {
    expect(classifyInteractionCount(0)).toEqual({
      zero: 1,
      atLeast1: 0,
      atLeast10: 0,
      atLeast20: 0,
    });
  });

  it('classifies a low count (1–9) as atLeast1 only', () => {
    expect(classifyInteractionCount(1)).toEqual({
      zero: 0,
      atLeast1: 1,
      atLeast10: 0,
      atLeast20: 0,
    });
    expect(classifyInteractionCount(9).atLeast1).toBe(1);
    expect(classifyInteractionCount(9).atLeast10).toBe(0);
  });

  it('classifies a mid count (10–19) as atLeast1 AND atLeast10', () => {
    expect(classifyInteractionCount(10)).toEqual({
      zero: 0,
      atLeast1: 1,
      atLeast10: 1,
      atLeast20: 0,
    });
    expect(classifyInteractionCount(19).atLeast20).toBe(0);
  });

  it('classifies a high count (>=20) as atLeast1, atLeast10 AND atLeast20', () => {
    expect(classifyInteractionCount(20)).toEqual({
      zero: 0,
      atLeast1: 1,
      atLeast10: 1,
      atLeast20: 1,
    });
    expect(classifyInteractionCount(500).atLeast20).toBe(1);
  });
});

describe('buildInteractionBuckets', () => {
  it('returns all zeros for an empty list', () => {
    expect(buildInteractionBuckets([])).toEqual({
      zero: 0,
      atLeast1: 0,
      atLeast10: 0,
      atLeast20: 0,
    });
  });

  it('sums overlapping buckets correctly across a mixed population', () => {
    // 0 → zero bucket
    // 5 → atLeast1
    // 12 → atLeast1 + atLeast10
    // 25 → atLeast1 + atLeast10 + atLeast20
    // 30 → atLeast1 + atLeast10 + atLeast20
    const buckets = buildInteractionBuckets([0, 5, 12, 25, 30]);
    expect(buckets).toEqual({
      zero: 1,
      atLeast1: 4, // everyone except the zero one
      atLeast10: 3, // 12, 25, 30
      atLeast20: 2, // 25, 30
    });
  });
});

// ---------------------------------------------------------------------------
// summarizeDeltasMs
// ---------------------------------------------------------------------------

describe('summarizeDeltasMs', () => {
  it('returns null for an empty list', () => {
    expect(summarizeDeltasMs([])).toBeNull();
  });

  it('computes avg, median, p90, min, max for a single value', () => {
    const summary = summarizeDeltasMs([60_000]);
    expect(summary).toEqual({
      count: 1,
      avgMs: 60_000,
      medianMs: 60_000,
      p90Ms: 60_000,
      minMs: 60_000,
      maxMs: 60_000,
    });
  });

  it('computes statistics for a mixed population', () => {
    // 10 values: 0s, 10s, 20s, ..., 90s.
    const deltas = Array.from({ length: 10 }, (_, i) => i * 10_000);
    const summary = summarizeDeltasMs(deltas);
    expect(summary).not.toBeNull();
    expect(summary!.count).toBe(10);
    expect(summary!.minMs).toBe(0);
    expect(summary!.maxMs).toBe(90_000);
    // avg = (0+...+90000)/10 = 45000
    expect(summary!.avgMs).toBe(45_000);
    // median (p50, nearest-rank, rank=ceil(0.5*10)=5 → idx 4 → 40000)
    expect(summary!.medianMs).toBe(40_000);
    // p90 (nearest-rank, rank=ceil(0.9*10)=9 → idx 8 → 80000)
    expect(summary!.p90Ms).toBe(80_000);
  });

  it('does not mutate the input array', () => {
    const input = [5_000, 1_000, 3_000];
    const snapshot = [...input];
    summarizeDeltasMs(input);
    expect(input).toEqual(snapshot);
  });
});
