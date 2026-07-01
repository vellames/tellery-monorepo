import { config } from '@/lib/config';
import type {
  BillingPortalResponse,
  CheckoutSessionResponse,
  CreateCheckoutPayload,
} from '@/lib/types/subscription';

export async function createCheckoutSessionRequest(
  payload: CreateCheckoutPayload = {}
): Promise<string> {
  const res = await fetch(config.routes.subscriptionCheckoutApi, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => null)) as
    | (CheckoutSessionResponse & { error?: string })
    | null;

  if (!res.ok || !body?.url) {
    throw new Error(body?.error ?? '');
  }

  return body.url;
}

export async function createBillingPortalSessionRequest(): Promise<string> {
  const res = await fetch(config.routes.subscriptionPortalApi, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const body = (await res.json().catch(() => null)) as
    | (BillingPortalResponse & { error?: string })
    | null;

  if (!res.ok || !body?.url) {
    throw new Error(body?.error ?? '');
  }

  return body.url;
}
