import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { ApiError, apiFetch } from '@/lib/api/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const lead = await apiFetch(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return NextResponse.json(lead, { status: StatusCodes.OK });
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'Failed to update lead';
    const status =
      error instanceof ApiError
        ? error.status
        : StatusCodes.INTERNAL_SERVER_ERROR;

    return NextResponse.json({ error: message }, { status });
  }
}
