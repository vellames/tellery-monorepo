import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';
import { config } from '@/lib/config';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale } from '@/i18n/config';
import type { InteractPayload, InteractResult } from '@/lib/types/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const { sessionId } = await params;
  const t = await getTranslations('play.panel');
  const contentType = req.headers.get('content-type') ?? '';

  try {
    if (contentType.startsWith('multipart/form-data')) {
      // Audio path: forward multipart directly to API
      const store = await cookies();
      const locale = store.get(LOCALE_COOKIE)?.value ?? defaultLocale;
      const token = store.get(config.auth.sessionCookie)?.value;

      const formData = await req.formData();

      const apiRes = await fetch(
        `${config.api.baseUrl}/session/${sessionId}/interact`,
        {
          method: 'POST',
          headers: {
            'Accept-Language': locale,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      const apiBody = (await apiRes.json().catch(() => null)) as {
        success: boolean;
        data?: InteractResult;
        error?: string;
      } | null;

      if (!apiRes.ok || !apiBody?.success || apiBody.data === undefined) {
        return NextResponse.json(
          { error: apiBody?.error ?? t('interactError') },
          { status: apiRes.status }
        );
      }

      return NextResponse.json(apiBody.data);
    }

    // Text path: JSON body
    const body = (await req.json().catch(() => null)) as InteractPayload | null;

    if (!body?.stateId || !body?.interaction) {
      return NextResponse.json(
        { error: t('invalidPayload') },
        { status: StatusCodes.UNPROCESSABLE_ENTITY }
      );
    }

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
