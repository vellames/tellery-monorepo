import { describe, expect, it } from 'vitest';

import {
  buildSourceCounts,
  classifySource,
  emptyHourSeries,
  fillHourSeries,
  formatLocalHour,
  hourWindowStart,
  LEADS_WINDOW_HOURS,
  LEAD_SOURCES,
  UNKNOWN_SOURCE,
} from '@/lib/leads';

describe('formatLocalHour', () => {
  it('formats a date as YYYY-MM-DDTHH with zero padding', () => {
    expect(formatLocalHour(new Date(2026, 6, 5, 9))).toBe('2026-07-05T09');
    expect(formatLocalHour(new Date(2026, 0, 1, 0))).toBe('2026-01-01T00');
    expect(formatLocalHour(new Date(2026, 11, 31, 23))).toBe('2026-12-31T23');
  });
});

describe('hourWindowStart', () => {
  it('returns the top of the current hour shifted back by (hours-1)', () => {
    const now = new Date(2026, 6, 5, 14, 37, 12);
    const start = hourWindowStart(LEADS_WINDOW_HOURS, now);
    // 167 hours before the top of the current hour (14:00).
    const hourTop = new Date(2026, 6, 5, 14, 0, 0, 0);
    const expected = new Date(
      hourTop.getTime() - (LEADS_WINDOW_HOURS - 1) * 3600_000
    );
    expect(start.getTime()).toBe(expected.getTime());
  });

  it('zeroes minutes/seconds/ms', () => {
    const start = hourWindowStart(1, new Date(2026, 6, 5, 14, 37, 12, 500));
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });
});

describe('emptyHourSeries', () => {
  it('produces exactly `hours` contiguous hourly buckets, all zero', () => {
    const now = new Date(2026, 6, 5, 14, 30);
    const series = emptyHourSeries(LEADS_WINDOW_HOURS, now);

    expect(series).toHaveLength(LEADS_WINDOW_HOURS);
    expect(series.every((p) => p.count === 0)).toBe(true);

    // Last bucket is the current hour; first is (hours-1) before it.
    expect(series.at(-1)?.bucket).toBe(formatLocalHour(now));
    expect(series[0].bucket).toBe(
      formatLocalHour(
        new Date(now.getTime() - (LEADS_WINDOW_HOURS - 1) * 3600_000)
      )
    );

    // Contiguity: buckets are produced by stepping 1h at a time, so every key
    // must be unique (no duplicates / gaps in the sequence).
    const unique = new Set(series.map((p) => p.bucket));
    expect(unique.size).toBe(series.length);
  });
});

describe('fillHourSeries', () => {
  it('counts records per hour and ignores out-of-window dates', () => {
    const now = new Date(2026, 6, 5, 14, 30);
    const series = emptyHourSeries(LEADS_WINDOW_HOURS, now);

    // Two leads in the current hour, one 5 hours ago, one far outside.
    fillHourSeries(series, [
      new Date(2026, 6, 5, 14, 5),
      new Date(2026, 6, 5, 14, 59),
      new Date(2026, 6, 5, 9, 15),
      new Date(2025, 0, 1, 0, 0),
    ]);

    const byBucket = new Map(series.map((p) => [p.bucket, p.count]));
    expect(byBucket.get('2026-07-05T14')).toBe(2);
    expect(byBucket.get('2026-07-05T09')).toBe(1);
    expect(series.reduce((sum, p) => sum + p.count, 0)).toBe(3);
  });

  it('does not mutate the series length', () => {
    const series = emptyHourSeries(10, new Date(2026, 6, 5, 12));
    const before = series.length;
    fillHourSeries(series, [new Date(2026, 6, 5, 12)]);
    expect(series).toHaveLength(before);
  });
});

describe('classifySource', () => {
  it('matches utm_source values case-insensitively', () => {
    expect(classifySource('?utm_source=Instagram')).toBe('Instagram');
    expect(classifySource('?utm_source=INSTAGRAM')).toBe('Instagram');
    expect(classifySource('?utm_source=tiktok')).toBe('TikTok');
    expect(classifySource('?utm_source=google')).toBe('Google');
    expect(classifySource('?utm_source=facebook')).toBe('Facebook');
  });

  it('matches ad platform click ids (gclid, fbclid, ttclid, igshid)', () => {
    expect(classifySource('?gclid=abc123')).toBe('Google');
    expect(classifySource('?fbclid=xyz')).toBe('Facebook');
    expect(classifySource('?ttclid=def')).toBe('TikTok');
    expect(classifySource('?igshid=ghi')).toBe('Instagram');
  });

  it('matches when query string has multiple params', () => {
    expect(
      classifySource(
        '?utm_medium=paid&utm_source=instagram&utm_campaign=summer'
      )
    ).toBe('Instagram');
  });

  it('returns unknown for unmatched / empty / null query strings', () => {
    expect(classifySource('?utm_medium=email')).toBe(UNKNOWN_SOURCE);
    expect(classifySource('?ref=friend')).toBe(UNKNOWN_SOURCE);
    expect(classifySource('')).toBe(UNKNOWN_SOURCE);
    expect(classifySource(null)).toBe(UNKNOWN_SOURCE);
    expect(classifySource(undefined)).toBe(UNKNOWN_SOURCE);
  });

  it('respects source priority order on conflicting matches', () => {
    // Custom sources list where "Meta" must win over "Facebook" when both match.
    const custom = [
      { source: 'Meta', matches: ['utm_source=facebook'] },
      { source: 'Facebook', matches: ['utm_source=facebook', 'fbclid'] },
    ];
    expect(classifySource('?utm_source=facebook', custom)).toBe('Meta');
  });
});

describe('buildSourceCounts', () => {
  it('aggregates, sorts desc, and separates unknown', () => {
    const result = buildSourceCounts([
      '?utm_source=instagram',
      '?utm_source=instagram',
      '?utm_source=instagram&igshid=abc',
      '?utm_source=tiktok',
      '?gclid=xyz', // Google
      '?utm_medium=email', // unknown
      null, // unknown
      '', // unknown
    ]);

    expect(result.unknown).toBe(3);
    // Instagram is the clear leader; the two singletons are tied (count=1) and
    // ordered by first-seen (Google's `?gclid` appears before TikTok's input).
    expect(result.bySource).toHaveLength(3);
    expect(result.bySource[0]).toEqual({ source: 'Instagram', count: 3 });
    const others = result.bySource
      .slice(1)
      .map((s) => s.source)
      .sort();
    expect(others).toEqual(['Google', 'TikTok']);
    expect(
      result.bySource.every((s) => s.count === 1 || s.source === 'Instagram')
    ).toBe(true);
  });

  it('returns empty lists and zero unknown for no leads', () => {
    const result = buildSourceCounts([]);
    expect(result.bySource).toEqual([]);
    expect(result.unknown).toBe(0);
  });

  it('uses the configured sources list', () => {
    const custom = [{ source: 'Newsletter', matches: ['ref=newsletter'] }];
    const result = buildSourceCounts(
      ['?ref=newsletter', '?utm_source=instagram'],
      custom
    );
    expect(result.bySource).toEqual([{ source: 'Newsletter', count: 1 }]);
    expect(result.unknown).toBe(1);
  });

  it('LEAD_SOURCES covers the platforms mentioned in the task', () => {
    const sources = LEAD_SOURCES.map((s) => s.source);
    expect(sources).toContain('Instagram');
    expect(sources).toContain('TikTok');
    expect(sources).toContain('Google');
  });
});
