import { StatusCodes } from 'http-status-codes';
import { clientFetch } from '@/lib/api/client-fetch';
import { ApiError, EMPTY_RESPONSE_BODY } from '@/lib/api/error';
import { withRetry } from '@/lib/api/retry';
import { config } from '@/lib/config';
import type {
  CreateLeadPayload,
  Lead,
  UpdateLeadPayload,
} from '@/lib/types/lead';

/**
 * Guards a lead returned by clientFetch. clientFetch casts the parsed body to
 * `T` without validating the shape, so in unstable webviews (e.g. TikTok) a 2xx
 * response with an empty/corrupted body can surface as `null`. A valid Lead
 * always has an `id`, so we throw a classified ApiError when it is missing.
 */
function assertLead(lead: Lead | null): Lead {
  if (!lead?.id) {
    throw new ApiError(EMPTY_RESPONSE_BODY, StatusCodes.OK);
  }
  return lead;
}

export async function createLeadRequest(
  payload: CreateLeadPayload
): Promise<Lead> {
  // POST /leads is idempotent on the backend (createOrGetActive), so it is safe
  // to retry transient network/empty-body failures.
  return withRetry(async () => {
    const lead = await clientFetch<Lead>(config.routes.leadApi, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return assertLead(lead);
  });
}

export async function updateLeadRequest(
  id: string,
  payload: UpdateLeadPayload
): Promise<Lead> {
  const lead = await clientFetch<Lead>(config.routes.leadDetailApi(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return assertLead(lead);
}
