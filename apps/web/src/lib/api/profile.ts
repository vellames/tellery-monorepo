import { clientFetch } from '@/lib/api/client-fetch';
import { config } from '@/lib/config';
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  User,
} from '@/lib/types/auth';

interface ProfileResponse {
  user: User;
}

export async function updateProfileRequest(
  payload: UpdateProfilePayload
): Promise<User> {
  const body = await clientFetch<ProfileResponse>(config.routes.meApi, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return body.user;
}

export async function changePasswordRequest(
  payload: ChangePasswordPayload
): Promise<void> {
  await clientFetch(config.routes.mePasswordApi, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
