import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';

export async function POST(): Promise<NextResponse> {
  const t = await getTranslations('subscription.errors');

  try {
    const data = await apiFetch<{ url: string }>('/subscriptions/portal', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return NextResponse.json({ url: data.url });
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: t('portalFailed'),
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };
    return NextResponse.json({ error: message }, { status });
  }
}
