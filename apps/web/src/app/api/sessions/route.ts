import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { PaginatedSessions } from '@/lib/types/session';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const page = url.searchParams.get('page') ?? '1';
  const limit = url.searchParams.get('limit') ?? '6';
  const status = url.searchParams.get('status') ?? '';

  try {
    const qs = `page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
    const data = await apiFetch<PaginatedSessions>(`/session?${qs}`);
    return NextResponse.json(data);
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: 'Failed to fetch sessions',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };

    return NextResponse.json({ error: message }, { status });
  }
}
