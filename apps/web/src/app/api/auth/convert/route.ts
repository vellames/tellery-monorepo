import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { setSession } from '@/lib/auth/session';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { AuthPayload, ConvertAccountPayload } from '@/lib/types/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('register.errors');
  const body = (await req
    .json()
    .catch(() => null)) as ConvertAccountPayload | null;

  if (!body?.name || !body?.email || !body?.password) {
    return NextResponse.json(
      { error: t('nameRequired') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const { token, user } = await apiFetch<AuthPayload>('/users/convert', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await setSession(token, user);
    return NextResponse.json({ user }, { status: StatusCodes.OK });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : t('registerFailed');
    const status =
      error instanceof ApiError
        ? error.status
        : StatusCodes.INTERNAL_SERVER_ERROR;

    return NextResponse.json({ error: message }, { status });
  }
}
