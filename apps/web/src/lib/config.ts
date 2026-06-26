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
    login: '/',
    register: '/register',
    forgotPassword: '/forgot-password',
    privacy: '/privacy',
    terms: '/terms',
    loginApi: '/api/auth/login',
    logoutApi: '/api/auth/logout',
    registerApi: '/api/auth/register',
  },
} as const;
