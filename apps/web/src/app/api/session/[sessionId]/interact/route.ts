import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { InteractPayload, InteractResult } from '@/lib/types/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const { sessionId } = await params;
  const body = (await req.json().catch(() => null)) as InteractPayload | null;
  const t = await getTranslations('play.panel');

  if (!body?.stateId || !body?.interaction) {
    return NextResponse.json(
      { error: t('invalidPayload') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const result = await apiFetch<InteractResult>(
      `/session/${sessionId}/interact`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
    return NextResponse.json(result);
  } catch (error) {
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: t('interactError'),
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };

    return NextResponse.json({ error: message }, { status });
  }
}
