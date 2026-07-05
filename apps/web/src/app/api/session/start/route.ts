import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';

interface StartSessionResponse {
  session: { id: string };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('stories');
  const body = (await req.json().catch(() => null)) as {
    storyId?: string;
  } | null;

  console.log('[BFF /api/session/start] body received', body);

  if (!body?.storyId) {
    console.log('[BFF /api/session/start] missing storyId');
    return NextResponse.json(
      { error: t('startError') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const data = await apiFetch<StartSessionResponse>('/session/start', {
      method: 'POST',
      body: JSON.stringify({ storyId: body.storyId }),
    });

    console.log('[BFF /api/session/start] success', {
      sessionId: data.session.id,
    });
    return NextResponse.json({ sessionId: data.session.id });
  } catch (error) {
    console.error('[BFF /api/session/start] error', {
      message: error instanceof Error ? error.message : String(error),
      status: error instanceof ApiError ? error.status : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });
    const { message, status } =
      error instanceof ApiError
        ? error
        : {
            message: t('startError'),
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };

    return NextResponse.json({ error: message }, { status });
  }
}
