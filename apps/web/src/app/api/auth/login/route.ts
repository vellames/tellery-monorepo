import { NextResponse, type NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { config } from '@/lib/config';
import { setSession } from '@/lib/auth/session';
import type { AuthPayload, LoginPayload } from '@/lib/types/auth';

interface ApiEnvelope {
  success: boolean;
  data?: AuthPayload;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as LoginPayload | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: 'E-mail e senha são obrigatórios' },
      { status: StatusCodes.UNPROCESSABLE_ENTITY }
    );
  }

  const res = await fetch(`${config.api.baseUrl}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as ApiEnvelope | null;

  if (!res.ok || !data?.success || !data.data) {
    return NextResponse.json(
      { error: data?.error ?? 'Falha ao entrar' },
      { status: res.ok ? StatusCodes.INTERNAL_SERVER_ERROR : res.status }
    );
  }

  const { token, user } = data.data;
  await setSession(token, user);
  return NextResponse.json({ user });
}
