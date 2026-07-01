export interface PlanDisplay {
  id: string;
  name: string;
  creditsPerCycle: number;
  interval: string;
  priceId: string;
  amountInCents: number;
  currency: string;
  active: boolean;
}

export interface SubscriptionState {
  id: string;
  status: string;
  planName: string | null;
  creditsPerCycle: number | null;
  stripePriceId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface BillingPortalResponse {
  url: string;
}

export interface CreateCheckoutPayload {
  priceId?: string;
}
