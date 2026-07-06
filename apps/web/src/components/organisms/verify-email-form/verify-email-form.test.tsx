import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('token=valid-token&lang=en'),
}));
vi.mock('@/i18n/actions', () => ({
  setLocale: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/api/auth', () => ({
  verifyEmailRequest: vi.fn(),
}));

import { verifyEmailRequest } from '@/lib/api/auth';
import { VerifyEmailForm } from '@/components/organisms/verify-email-form/verify-email-form';
import { renderWithProviders } from '@/test-utils';

describe('VerifyEmailForm', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('shows the success state when the token is valid', async () => {
    vi.mocked(verifyEmailRequest).mockResolvedValue({
      id: '1',
      name: 'Ana',
      email: 'a@b.c',
      accountType: 'permanent',
      ssn: null,
      emailVerifiedAt: '2026-07-01T00:00:00.000Z',
      createdAt: '',
      updatedAt: '',
    });

    renderWithProviders(<VerifyEmailForm />);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /e-mail verificado/i })
      ).toBeInTheDocument()
    );
    expect(verifyEmailRequest).toHaveBeenCalledWith('valid-token');
    expect(
      screen.getByText(/você já pode fechar esta aba/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /continuar/i })
    ).not.toBeInTheDocument();
  });

  it('shows the error state when verification fails', async () => {
    vi.mocked(verifyEmailRequest).mockRejectedValue(new Error('invalid'));

    renderWithProviders(<VerifyEmailForm />);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /link inválido/i })
      ).toBeInTheDocument()
    );
  });
});
