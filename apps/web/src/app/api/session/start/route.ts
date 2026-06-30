import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';
import { refreshSessionUser } from '@/lib/api/me';

interface StartSessionResponse {
  session: { id: string };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const t = await getTranslations('stories');
  const body = (await req.json().catch(() => null)) as {
    historyId?: string;
  } | null;

  if (!body?.historyId) {
    return NextResponse.json(
      { error: t('startError') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const data = await apiFetch<StartSessionResponse>('/session/start', {
      method: 'POST',
      body: JSON.stringify({ historyId: body.historyId }),
    });

    // Keep the header session count in sync after a successful start.
    await refreshSessionUser().catch(() => {});

    return NextResponse.json({ sessionId: data.session.id });
  } catch (error) {
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
