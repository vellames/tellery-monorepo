import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { setSession } from '@/lib/auth/session';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { AuthPayload } from '@/lib/types/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('common.errors');
  const body = (await req.json().catch(() => null)) as {
    leadId?: string;
  } | null;

  try {
    const { token, user } = await apiFetch<AuthPayload>('/users/temporary', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
    await setSession(token, user);
    return NextResponse.json({ user }, { status: StatusCodes.CREATED });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : t('internalError');
    const status =
      error instanceof ApiError
        ? error.status
        : StatusCodes.INTERNAL_SERVER_ERROR;

    return NextResponse.json({ error: message }, { status });
  }
}
