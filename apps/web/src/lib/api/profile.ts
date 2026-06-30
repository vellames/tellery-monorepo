import { config } from '@/lib/config';
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  User,
} from '@/lib/types/auth';

export async function updateProfileRequest(
  payload: UpdateProfilePayload
): Promise<User> {
  const res = await fetch(config.routes.meApi, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => null)) as {
    user?: User;
    error?: string;
  } | null;

  if (!res.ok || !body?.user) {
    throw new Error(body?.error ?? '');
  }

  return body.user;
}

export async function changePasswordRequest(
  payload: ChangePasswordPayload
): Promise<void> {
  const res = await fetch(config.routes.mePasswordApi, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? '');
  }
}
