import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { RegisterPayload } from '@/lib/types/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('register.errors');
  const body = (await req.json().catch(() => null)) as RegisterPayload | null;

  if (!body?.name || !body?.email || !body?.password) {
    return NextResponse.json(
      { error: t('nameRequired') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    await apiFetch('/users/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(
      { success: true },
      { status: StatusCodes.CREATED }
    );
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
