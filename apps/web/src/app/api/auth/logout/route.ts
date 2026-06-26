import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { clearSession } from '@/lib/auth/session';

export async function POST(): Promise<NextResponse> {
  await clearSession();
  return NextResponse.json({ success: true }, { status: StatusCodes.OK });
}
