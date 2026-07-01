import 'server-only';
import { apiFetch } from '@/lib/api/client';
import type { PlanDisplay, SubscriptionState } from '@/lib/types/subscription';

export async function fetchSubscriptionPlan(): Promise<PlanDisplay | null> {
  return apiFetch<PlanDisplay | null>('/subscriptions/plan');
}

export async function fetchSubscription(): Promise<SubscriptionState | null> {
  return apiFetch<SubscriptionState | null>('/subscriptions');
}

export async function fetchSubscriptionSynced(): Promise<SubscriptionState | null> {
  return apiFetch<SubscriptionState | null>('/subscriptions?sync=1');
}
