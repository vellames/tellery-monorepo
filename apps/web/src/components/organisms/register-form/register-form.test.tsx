import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Sentry from '@sentry/nextjs';

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/api/auth', () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

import { registerRequest } from '@/lib/api/auth';
import { RegisterForm } from '@/components/organisms/register-form/register-form';
import { renderWithProviders } from '@/test-utils';

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome'), 'Ana');
  await user.type(screen.getByLabelText('E-mail'), 'a@b.c');
  await user.type(screen.getByLabelText('Senha'), '123456');
  await user.type(screen.getByLabelText('Repita a senha'), '123456');
}

describe('RegisterForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks submit when terms are not accepted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(
      await screen.findByText(/você precisa aceitar os termos de uso/i)
    ).toBeInTheDocument();
    expect(registerRequest).not.toHaveBeenCalled();
  });

  it('creates the account and redirects home', async () => {
    vi.mocked(registerRequest).mockResolvedValue({
      id: '1',
      name: 'Ana',
      email: 'a@b.c',
      ssn: null,
      emailVerifiedAt: null,
      createdAt: '',
      updatedAt: '',
    });
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillValid(user);
    await user.click(screen.getByRole('checkbox', { name: /termos de uso/i }));
    await user.click(
      screen.getByRole('checkbox', { name: /política de privacidade/i })
    );
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() =>
      expect(registerRequest).toHaveBeenCalledWith({
        name: 'Ana',
        email: 'a@b.c',
        password: '123456',
      })
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/home'));
  });
});

/**
 * IntersectionObserver entry shape used by the visibility tests. Only the
 * fields the component reads are populated — the rest are not accessed.
 */
type MockEntry = {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: { width: number; height: number };
};

describe('RegisterForm visibility telemetry', () => {
  let ioCallback: ((entries: IntersectionObserverEntry[]) => void) | null =
    null;
  const originalIO = window.IntersectionObserver;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    ioCallback = null;
    // Regular function (not arrow) so `new IntersectionObserver(cb)` works.
    function StubIntersectionObserver(
      this: unknown,
      cb: (entries: IntersectionObserverEntry[]) => void
    ) {
      ioCallback = cb;
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
      } as unknown as IntersectionObserver;
    }
    window.IntersectionObserver =
      StubIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
    window.IntersectionObserver = originalIO;
    ioCallback = null;
  });

  function emitEntry(entry: MockEntry) {
    ioCallback?.([entry as unknown as IntersectionObserverEntry]);
  }

  function expectBreadcrumb(message: string) {
    expect(vi.mocked(Sentry.addBreadcrumb)).toHaveBeenCalledWith(
      expect.objectContaining({ message })
    );
  }

  it('fires signup_form_mounted with geometry baseline and IO support', () => {
    renderWithProviders(<RegisterForm />);

    expectBreadcrumb('signup_form_mounted');
    const call = vi
      .mocked(Sentry.addBreadcrumb)
      .mock.calls.find((c) => c[0]?.message === 'signup_form_mounted');
    expect(call?.[0]?.data).toEqual(
      expect.objectContaining({
        hasFormRef: true,
        hasIntersectionObserver: true,
      })
    );
  });

  it('fires signup_form_visible when the observer reports intersection', () => {
    renderWithProviders(<RegisterForm />);

    emitEntry({
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: { width: 400, height: 600 },
    });

    expectBreadcrumb('signup_form_visible');
    const call = vi
      .mocked(Sentry.addBreadcrumb)
      .mock.calls.find((c) => c[0]?.message === 'signup_form_visible');
    expect(call?.[0]?.data).toEqual(
      expect.objectContaining({ ratio: 1, rectWidth: 400, rectHeight: 600 })
    );
  });

  it('fires signup_form_visible_timeout as an error after 5s without visibility', () => {
    renderWithProviders(<RegisterForm />);

    vi.advanceTimersByTime(5001);

    expectBreadcrumb('signup_form_visible_timeout');
    expect(vi.mocked(Sentry.captureException)).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { signup_event: 'signup_form_visible_timeout' },
      })
    );
    const captureHint = vi.mocked(Sentry.captureException).mock
      .calls[0]?.[1] as
      | { contexts?: { signup?: Record<string, unknown> } }
      | undefined;
    expect(captureHint?.contexts?.signup).toEqual(
      expect.objectContaining({
        lastIntersectionRatio: null,
        lastIsIntersecting: null,
      })
    );
  });

  it('does not fire the timeout after the form becomes visible', () => {
    renderWithProviders(<RegisterForm />);

    emitEntry({
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: { width: 400, height: 600 },
    });
    vi.advanceTimersByTime(5001);

    const sawTimeout = vi
      .mocked(Sentry.addBreadcrumb)
      .mock.calls.some((c) => c[0]?.message === 'signup_form_visible_timeout');
    expect(sawTimeout).toBe(false);
    expect(vi.mocked(Sentry.captureException)).not.toHaveBeenCalled();
  });

  it('clears the visibility timeout on unmount', () => {
    const { unmount } = renderWithProviders(<RegisterForm />);
    unmount();

    vi.advanceTimersByTime(5001);

    expect(vi.mocked(Sentry.captureException)).not.toHaveBeenCalled();
  });

  it('falls back to immediate signup_form_visible when IntersectionObserver is absent', () => {
    // Simulate an environment (e.g. jsdom default, some webviews) without IO.
    // @ts-expect-error: deleting a non-optional global for the test.
    delete window.IntersectionObserver;

    renderWithProviders(<RegisterForm />);

    expectBreadcrumb('signup_form_visible');
    expectBreadcrumb('signup_form_mounted'); // baseline still fires
    expect(vi.mocked(Sentry.captureException)).not.toHaveBeenCalled();
  });
});
