// Subset of the RevenueCat webhook event schema we act on. RevenueCat sends
// many more fields than modeled here; unknown ones are ignored.
// See: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
export type RevenueCatEventType =
  | 'TEST'
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'UNCANCELLATION'
  | 'PRODUCT_CHANGE'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'SUBSCRIPTION_PAUSED'
  | 'SUBSCRIPTION_EXTENDED'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIBER_ALIAS'
  | 'TRANSFER'
  | (string & {});

export interface RevenueCatWebhookEvent {
  id: string;
  type: RevenueCatEventType;
  app_user_id: string;
  product_id?: string | null;
  new_product_id?: string | null;
  original_transaction_id?: string | null;
  transaction_id?: string | null;
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  environment?: 'SANDBOX' | 'PRODUCTION';
  store?: string;
}

export interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatWebhookEvent;
}
