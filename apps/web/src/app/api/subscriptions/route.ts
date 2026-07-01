import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { SubscriptionState } from '@/lib/types/subscription';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await apiFetch<SubscriptionState | null>('/subscriptions');
    return NextResponse.json({ subscription: data });
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: 'Failed to load subscription',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };
    return NextResponse.json({ error: message }, { status });
  }
}
