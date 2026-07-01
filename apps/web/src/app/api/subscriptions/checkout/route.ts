import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { CreateCheckoutPayload } from '@/lib/types/subscription';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('subscription.errors');
  const body = (await req
    .json()
    .catch(() => null)) as CreateCheckoutPayload | null;

  try {
    const data = await apiFetch<{ url: string }>('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
    return NextResponse.json({ url: data.url });
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: t('checkoutFailed'),
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };
    return NextResponse.json({ error: message }, { status });
  }
}
