export const COOKIE_CONSENT_NAME = 'ah_cookie_consent';
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type CookieConsentValue = 'accepted' | 'rejected';

function buildCookieString(value: CookieConsentValue, maxAge: number): string {
  return [
    `${COOKIE_CONSENT_NAME}=${value}`,
    `max-age=${maxAge}`,
    'path=/',
    'SameSite=Lax',
  ].join('; ');
}

export function getConsent(): CookieConsentValue | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_CONSENT_NAME}=`));

  if (!match) return null;
  const value = match.split('=')[1];
  return value === 'accepted' || value === 'rejected' ? value : null;
}

export function setConsent(
  value: CookieConsentValue,
  maxAge: number = COOKIE_CONSENT_MAX_AGE
): void {
  if (typeof document === 'undefined') return;
  document.cookie = buildCookieString(value, maxAge);
}

export function hasDecided(): boolean {
  return getConsent() !== null;
}
