import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { updateSessionUser } from '@/lib/auth/session';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { User } from '@/lib/types/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('verifyEmail.errors');
  const body = (await req.json().catch(() => null)) as {
    token?: string;
  } | null;

  if (!body?.token) {
    return NextResponse.json(
      { error: t('missingToken') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const user = await apiFetch<User>('/users/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: body.token }),
    });
    await updateSessionUser(user);
    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : t('verifyFailed');
    const status =
      error instanceof ApiError
        ? error.status
        : StatusCodes.INTERNAL_SERVER_ERROR;

    return NextResponse.json({ error: message }, { status });
  }
}
