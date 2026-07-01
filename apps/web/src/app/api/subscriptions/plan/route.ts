import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { PlanDisplay } from '@/lib/types/subscription';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await apiFetch<PlanDisplay | null>('/subscriptions/plan');
    return NextResponse.json({ plan: data });
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: 'Failed to load plan',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };
    return NextResponse.json({ error: message }, { status });
  }
}
