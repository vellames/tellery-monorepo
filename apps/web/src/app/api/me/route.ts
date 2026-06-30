import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { updateSessionUser } from '@/lib/auth/session';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { UpdateProfilePayload, User } from '@/lib/types/auth';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('profile.errors');
  const body = (await req
    .json()
    .catch(() => null)) as UpdateProfilePayload | null;

  if (!body?.name || !body?.email) {
    return NextResponse.json(
      { error: t('required') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const user = await apiFetch<User>('/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    await updateSessionUser(user);
    return NextResponse.json({ user });
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: t('updateFailed'),
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };

    return NextResponse.json({ error: message }, { status });
  }
}
