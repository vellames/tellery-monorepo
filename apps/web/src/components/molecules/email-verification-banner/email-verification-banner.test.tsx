import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/api/auth', () => ({
  resendVerificationRequest: vi.fn(),
}));

import { toast } from 'sonner';
import { resendVerificationRequest } from '@/lib/api/auth';
import { EmailVerificationBanner } from '@/components/molecules/email-verification-banner/email-verification-banner';
import { renderWithProviders } from '@/test-utils';

describe('EmailVerificationBanner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the verify message and a resend button', () => {
    renderWithProviders(<EmailVerificationBanner />);

    expect(screen.getByText(/ainda não foi verificado/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reenviar/i })
    ).toBeInTheDocument();
  });

  it('resends the verification on click and toasts success', async () => {
    vi.mocked(resendVerificationRequest).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<EmailVerificationBanner />);

    await user.click(screen.getByRole('button', { name: /reenviar/i }));

    expect(resendVerificationRequest).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('toasts an error when resend fails', async () => {
    vi.mocked(resendVerificationRequest).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderWithProviders(<EmailVerificationBanner />);

    await user.click(screen.getByRole('button', { name: /reenviar/i }));

    expect(toast.error).toHaveBeenCalled();
  });
});
