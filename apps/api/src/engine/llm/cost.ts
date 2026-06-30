import type { ModelPricing } from '../../config/app.config';

export const NANOSCALE = 1_000_000_000n;

export function toNanos(usd: number): bigint {
  return BigInt(Math.round(usd * Number(NANOSCALE)));
}

export function fromNanos(nanos: bigint): number {
  return Number(nanos) / Number(NANOSCALE);
}

export function computeCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
  pricing: Record<string, ModelPricing>
): number {
  const tier = pricing[model];
  if (!tier) return 0;
  return (
    (promptTokens / 1_000_000) * tier.promptPerMillion +
    (completionTokens / 1_000_000) * tier.completionPerMillion
  );
}

export function computeAudioCostUsd(
  model: string,
  audioSeconds: number,
  pricing: Record<string, ModelPricing>
): number {
  const tier = pricing[model];
  if (!tier?.perMinute) return 0;
  return (audioSeconds / 60) * tier.perMinute;
}
