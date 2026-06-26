'use server';

import { cookies } from 'next/headers';
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from './config';

export async function setLocale(locale: Locale): Promise<void> {
  const value = locales.includes(locale) ? locale : defaultLocale;
  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
