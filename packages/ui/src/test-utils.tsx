import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { type ReactNode } from 'react';

const messages = {
  'pt-BR': {
    cookieConsent: {
      ariaLabel: 'Aviso de cookies',
      description:
        'Usamos cookies para melhorar sua experiência. <link>Saiba mais</link>.',
      accept: 'Aceitar',
      reject: 'Rejeitar',
    },
  },
  en: {
    cookieConsent: {
      ariaLabel: 'Cookie notice',
      description:
        'We use cookies to improve your experience. <link>Learn more</link>.',
      accept: 'Accept',
      reject: 'Reject',
    },
  },
} as const;

type Locale = keyof typeof messages;

export function renderWithIntl(
  ui: ReactNode,
  { locale = 'pt-BR', ...options }: { locale?: Locale } & RenderOptions = {}
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {ui}
    </NextIntlClientProvider>,
    options
  );
}

export { messages };
