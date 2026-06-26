export const config = {
  api: {
    baseUrl: process.env.API_URL ?? 'http://localhost:3232',
  },
  i18n: {
    defaultLocale: 'pt-BR',
  },
  auth: {
    sessionCookie: 'ai-history.session',
    userCookie: 'ai-history.user',
    maxAgeSeconds: 60 * 60 * 24 * 7,
  },
  routes: {
    home: '/',
    login: '/login',
    loginApi: '/api/auth/login',
    logoutApi: '/api/auth/logout',
  },
} as const;
