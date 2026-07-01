export interface CreateCheckoutDto {
  priceId?: string;
}

export interface CheckoutSessionResponseDto {
  url: string;
}

export interface BillingPortalResponseDto {
  url: string;
}

export interface PlanDisplayDto {
  id: string;
  name: string;
  creditsPerCycle: number;
  interval: string;
  priceId: string;
  amountInCents: number;
  currency: string;
  active: boolean;
}

export interface SubscriptionResponseDto {
  id: string;
  status: string;
  planName: string | null;
  creditsPerCycle: number | null;
  stripePriceId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface CreateSubscriptionData {
  userId: string;
  stripeCustomerId: string;
  status: import('@prisma/client').SubscriptionStatus;
}

export interface UpdateSubscriptionData {
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  planId?: string | null;
  status?: import('@prisma/client').SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}
