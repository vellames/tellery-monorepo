import { notFound } from 'next/navigation';
import { StatusCodes } from 'http-status-codes';
import { fetchSession } from '@/lib/api/session';
import { ApiError } from '@/lib/api/client';
import { SessionHub } from '@/components/organisms';
import type { SessionState } from '@/lib/types/session';

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  let session: SessionState;
  try {
    session = await fetchSession(sessionId);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === StatusCodes.NOT_FOUND ||
        error.status === StatusCodes.FORBIDDEN)
    ) {
      notFound();
    }
    throw error;
  }

  return <SessionHub session={session} />;
}
