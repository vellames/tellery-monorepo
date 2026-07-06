import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

function makeReq(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  return new NextRequest(new URL(`http://localhost${path}`), {
    headers,
  });
}

describe('proxy', () => {
  it('redirects unauthenticated users from protected routes to login', () => {
    const res = proxy(makeReq('/home'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/?from=%2Fhome');
  });

  it.each(['/', '/register', '/forgot-password'])(
    'allows unauthenticated users on auth route %s',
    (path) => {
      expect(proxy(makeReq(path)).status).toBe(200);
    }
  );

  it.each(['/privacy', '/terms', '/verify-email'])(
    'allows public route %s without session',
    (path) => {
      expect(proxy(makeReq(path)).status).toBe(200);
    }
  );

  it('allows verify-email even when the visitor already has a session', () => {
    expect(
      proxy(makeReq('/verify-email', 'ai-history.session=tok')).status
    ).toBe(200);
  });

  it('allows the Sentry tunnel without session', () => {
    expect(proxy(makeReq('/monitoring')).status).toBe(200);
  });

  it('allows the Sentry example page without session', () => {
    expect(proxy(makeReq('/sentry-example-page')).status).toBe(200);
  });

  it('redirects authenticated users away from auth routes to home', () => {
    const res = proxy(makeReq('/', 'ai-history.session=tok'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/home');
  });

  it('lets authenticated users through protected routes', () => {
    expect(proxy(makeReq('/home', 'ai-history.session=tok')).status).toBe(200);
  });

  it.each(['/ad-stories', '/ad-stories/some-slug'])(
    'allows unauthenticated users on the ad landing route %s',
    (path) => {
      expect(proxy(makeReq(path)).status).toBe(200);
    }
  );
});
