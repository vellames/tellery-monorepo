import { NextResponse, type NextRequest } from 'next/server';
import { config as appConfig } from '@/lib/config';

const AUTH_ROUTES: string[] = [
  appConfig.routes.login,
  appConfig.routes.register,
  appConfig.routes.forgotPassword,
];

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const hasSession = Boolean(
    req.cookies.get(appConfig.auth.sessionCookie)?.value
  );

  if (!hasSession && !isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = appConfig.routes.login;
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = appConfig.routes.home;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
