import { NextResponse, type NextRequest } from 'next/server';
import { config as appConfig } from '@/lib/config';

const PUBLIC_ROUTES: string[] = [appConfig.routes.login];

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const hasSession = Boolean(req.cookies.get(appConfig.auth.sessionCookie)?.value);

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = appConfig.routes.login;
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === appConfig.routes.login) {
    const url = req.nextUrl.clone();
    url.pathname = appConfig.routes.home;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
