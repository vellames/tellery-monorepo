import { clientFetch } from '@/lib/api/client-fetch';
import { config } from '@/lib/config';
import type {
  CreateLeadPayload,
  Lead,
  UpdateLeadPayload,
} from '@/lib/types/lead';

export async function createLeadRequest(
  payload: CreateLeadPayload
): Promise<Lead> {
  return clientFetch<Lead>(config.routes.leadApi, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLeadRequest(
  id: string,
  payload: UpdateLeadPayload
): Promise<Lead> {
  return clientFetch<Lead>(config.routes.leadDetailApi(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
