import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { ApiError, apiFetch } from '@/lib/api/client';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const { sessionId } = await params;

  try {
    await apiFetch(`/session/${sessionId}/abandon`, { method: 'POST' });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: 'Failed to abandon session',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };

    return NextResponse.json({ error: message }, { status });
  }
}
