import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { COOKIE_CONSENT_NAME, getConsent } from './consent-cookie';
import { CookieConsentBanner } from './cookie-consent-banner';
import { renderWithIntl } from '../test-utils';

function setCookieRaw(value: string) {
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; path=/`;
}

function readCookie(): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_CONSENT_NAME}=`));
  return match ? match.split('=')[1] : null;
}

describe('CookieConsentBanner', () => {
  afterEach(() => {
    document.cookie = `${COOKIE_CONSENT_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  it('renders after mount when no consent cookie exists', () => {
    renderWithIntl(<CookieConsentBanner privacyHref="/privacy" />);

    expect(
      screen.getByRole('region', { name: /aviso de cookies/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /aceitar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /rejeitar/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /saiba mais/i })).toHaveAttribute(
      'href',
      '/privacy'
    );
  });

  it('does not render when the user already decided', () => {
    setCookieRaw('accepted');

    renderWithIntl(<CookieConsentBanner privacyHref="/privacy" />);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('writes the accepted value and hides on Accept click', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    renderWithIntl(
      <CookieConsentBanner privacyHref="/privacy" onAccept={onAccept} />
    );

    await user.click(screen.getByRole('button', { name: /aceitar/i }));

    expect(readCookie()).toBe('accepted');
    expect(getConsent()).toBe('accepted');
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('writes the rejected value and hides on Reject click', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    renderWithIntl(
      <CookieConsentBanner privacyHref="/privacy" onReject={onReject} />
    );

    await user.click(screen.getByRole('button', { name: /rejeitar/i }));

    expect(readCookie()).toBe('rejected');
    expect(getConsent()).toBe('rejected');
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('opens external links in a new tab', () => {
    renderWithIntl(
      <CookieConsentBanner privacyHref="https://example.com/privacy" />
    );

    const link = screen.getByRole('link', { name: /saiba mais/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
