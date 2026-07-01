'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '../lib/cn';
import {
  COOKIE_CONSENT_NAME,
  setConsent,
  type CookieConsentValue,
} from './consent-cookie';

export interface CookieConsentBannerProps {
  /** Link para a política de privacidade (relativo ou URL absoluta). */
  privacyHref: string;
  /** Onde abrir o link da política. Usa `_blank` quando a URL é externa. */
  privacyTarget?: '_self' | '_blank';
  /** Callback opcional quando o usuário aceita todos os cookies. */
  onAccept?: () => void;
  /** Callback opcional quando o usuário rejeita cookies opcionais. */
  onReject?: () => void;
  /** Nome do cookie de consentimento (sobrescreve o padrão). */
  cookieName?: string;
}

export function CookieConsentBanner({
  privacyHref,
  privacyTarget,
  onAccept,
  onReject,
  cookieName = COOKIE_CONSENT_NAME,
}: CookieConsentBannerProps) {
  const t = useTranslations('cookieConsent');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${cookieName}=`));

    if (!existing) setVisible(true);
  }, [cookieName]);

  function decide(value: CookieConsentValue) {
    setConsent(value);
    setVisible(false);
    if (value === 'accepted') onAccept?.();
    else onReject?.();
  }

  if (!visible) return null;

  const isExternal = /^https?:\/\//i.test(privacyHref);
  const target = privacyTarget ?? (isExternal ? '_blank' : '_self');

  return (
    <div
      role="region"
      aria-label={t('ariaLabel')}
      className={cn('fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6')}
    >
      <div
        className={cn(
          'mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5',
          'bg-card/95 text-foreground shadow-soft backdrop-blur'
        )}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t.rich('description', {
            link: (chunks) => (
              <a
                href={privacyHref}
                target={target}
                rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          <button
            type="button"
            onClick={() => decide('rejected')}
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition',
              'border border-border bg-transparent text-foreground hover:bg-muted'
            )}
          >
            {t('reject')}
          </button>
          <button
            type="button"
            onClick={() => decide('accepted')}
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition',
              'bg-primary text-primary-foreground shadow-button hover:opacity-90'
            )}
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
