import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { ChangePasswordPayload } from '@/lib/types/auth';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('profile.password.errors');
  const body = (await req
    .json()
    .catch(() => null)) as ChangePasswordPayload | null;

  if (!body?.currentPassword || !body?.newPassword) {
    return NextResponse.json(
      { error: t('required') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    await apiFetch<null>('/me/password', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true });
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
