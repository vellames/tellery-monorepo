import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { ApiError, apiFetch } from '@/lib/api/client';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as {
    localUuid?: string;
    queryParams?: string;
  } | null;

  if (!body?.localUuid) {
    return NextResponse.json(
      { error: 'Missing localUuid' },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const lead = await apiFetch('/leads', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(lead, { status: StatusCodes.CREATED });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'Failed to create lead';
    const status =
      error instanceof ApiError
        ? error.status
        : StatusCodes.INTERNAL_SERVER_ERROR;

    return NextResponse.json({ error: message }, { status });
  }
}
