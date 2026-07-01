import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { ApiError, apiFetch } from '@/lib/api/client';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await apiFetch<{ availableCredits: number }>(
      '/me/available-credits'
    );
    return NextResponse.json({ availableCredits: data.availableCredits });
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: 'Failed to load credits',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };
    return NextResponse.json({ error: message }, { status });
  }
}
