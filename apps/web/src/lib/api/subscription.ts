import { clientFetch } from '@/lib/api/client-fetch';
import { config } from '@/lib/config';
import type { CreateCheckoutPayload } from '@/lib/types/subscription';

export async function createCheckoutSessionRequest(
  payload: CreateCheckoutPayload = {}
): Promise<string> {
  const body = await clientFetch<{ url: string }>(
    config.routes.subscriptionCheckoutApi,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return body.url;
}

export async function createBillingPortalSessionRequest(): Promise<string> {
  const body = await clientFetch<{ url: string }>(
    config.routes.subscriptionPortalApi,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
  return body.url;
}
