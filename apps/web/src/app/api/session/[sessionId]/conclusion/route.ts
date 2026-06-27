import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { ConclusionResult } from '@/lib/types/session';

interface ConclusionBody {
  answers: { fieldId: string; optionId: string }[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const { sessionId } = await params;
  const body = (await req.json().catch(() => null)) as ConclusionBody | null;
  const t = await getTranslations('play');

  if (
    !body?.answers ||
    !Array.isArray(body.answers) ||
    body.answers.length === 0
  ) {
    return NextResponse.json(
      { error: t('conclusionValidationError') },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  try {
    const result = await apiFetch<ConclusionResult>(
      `/session/${sessionId}/conclusion`,
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
            message: t('conclusionError'),
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };

    return NextResponse.json({ error: message }, { status });
  }
}
