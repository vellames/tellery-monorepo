import { toNanos, fromNanos, NANOSCALE, computeAudioCostUsd } from '../cost';

const pricing = {
  'openai/whisper-1': {
    promptPerMillion: 0,
    completionPerMillion: 0,
    perMinute: 0.006,
  },
} as const;

describe('cost nanos conversion', () => {
  it('converts a small USD value to nano-dollars', () => {
    expect(toNanos(0.00009)).toBe(90_000n);
  });

  it('converts zero', () => {
    expect(toNanos(0)).toBe(0n);
  });

  it('rounds to the nearest nano-dollar', () => {
    // 0.0000001806 * 1e9 = 180.6 -> 181 after Math.round (half rounds up)
    expect(toNanos(0.0000001806)).toBe(181n);
    // 0.0000001794 * 1e9 = 179.4 -> 179
    expect(toNanos(0.0000001794)).toBe(179n);
  });

  it('converts nano-dollars back to USD', () => {
    expect(fromNanos(90_000n)).toBeCloseTo(0.00009, 9);
  });

  it('round-trips within nano precision', () => {
    const usd = 0.001234567;
    expect(fromNanos(toNanos(usd))).toBeCloseTo(usd, 9);
  });

  it('exposes the scale constant', () => {
    expect(NANOSCALE).toBe(1_000_000_000n);
  });
});

describe('computeAudioCostUsd', () => {
  it('computes cost from whole seconds and a per-minute price', () => {
    // 30 seconds @ $0.006/min = 0.5 min * 0.006 = 0.003
    expect(computeAudioCostUsd('openai/whisper-1', 30, pricing)).toBeCloseTo(
      0.003,
      9
    );
  });

  it('charges a single second at the per-second rate', () => {
    // 1s @ $0.006/min = 0.006/60 = 0.0001
    expect(computeAudioCostUsd('openai/whisper-1', 1, pricing)).toBeCloseTo(
      0.0001,
      9
    );
  });

  it('returns 0 for an unknown model', () => {
    expect(computeAudioCostUsd('unknown/model', 30, pricing)).toBe(0);
  });
});
