import { NextResponse, type NextRequest } from 'next/server';
import { config as appConfig } from '@/lib/config';

const AUTH_ROUTES: string[] = [
  appConfig.routes.login,
  appConfig.routes.register,
  appConfig.routes.forgotPassword,
];

const PUBLIC_INFO_ROUTES: string[] = [
  appConfig.routes.privacy,
  appConfig.routes.terms,
];

const TECHNICAL_ROUTES: string[] = ['/monitoring', '/sentry-example-page'];

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublic =
    isAuthRoute ||
    PUBLIC_INFO_ROUTES.includes(pathname) ||
    TECHNICAL_ROUTES.includes(pathname);
  const hasSession = Boolean(
    req.cookies.get(appConfig.auth.sessionCookie)?.value
  );

  if (!hasSession && !isPublic) {
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
  matcher: [
    '/((?!api|monitoring|sentry-example-page|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
