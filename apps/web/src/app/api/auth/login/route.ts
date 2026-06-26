import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { setSession } from '@/lib/auth/session';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { AuthPayload, LoginPayload } from '@/lib/types/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('auth.errors');
  const body = (await req.json().catch(() => null)) as LoginPayload | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: t('required') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const { token, user } = await apiFetch<AuthPayload>('/users/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await setSession(token, user);
    return NextResponse.json({ user });
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: t('loginFailed'),
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };

    return NextResponse.json({ error: message }, { status });
  }
}
