export const config = {
  api: {
    baseUrl: process.env.API_URL ?? 'http://localhost:3232',
  },
  auth: {
    sessionCookie: 'ai-history.session',
    userCookie: 'ai-history.user',
    maxAgeSeconds: 60 * 60 * 24 * 7,
  },
  routes: {
    home: '/home',
    journey: '/journey',
    stories: '/stories',
    session: (sessionId: string) => `/sessions/${sessionId}`,
    login: '/',
    register: '/register',
    forgotPassword: '/forgot-password',
    privacy: '/privacy',
    terms: '/terms',
    profile: '/profile',
    loginApi: '/api/auth/login',
    logoutApi: '/api/auth/logout',
    registerApi: '/api/auth/register',
    meApi: '/api/me',
  },
} as const;
