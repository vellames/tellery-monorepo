import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';

export async function POST(_req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('verifyEmail.errors');

  try {
    await apiFetch('/users/resend-verification', { method: 'POST' });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : t('resendFailed');
    const status =
      error instanceof ApiError
        ? error.status
        : StatusCodes.INTERNAL_SERVER_ERROR;

    return NextResponse.json({ error: message }, { status });
  }
}
