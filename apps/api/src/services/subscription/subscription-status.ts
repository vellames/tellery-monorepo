import { Subscription, SubscriptionStatus } from '@prisma/client';

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
]);

export function isActiveSubscription(
  subscription: Pick<Subscription, 'status'> | null
): boolean {
  return !!subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
}
