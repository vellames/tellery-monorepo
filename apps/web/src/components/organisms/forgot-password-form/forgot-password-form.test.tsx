import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from '@/components/organisms/forgot-password-form/forgot-password-form';
import { renderWithProviders } from '@/test-utils';

describe('ForgotPasswordForm', () => {
  it('shows the success message after submitting the email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('E-mail'), 'a@b.c');
    await user.click(screen.getByRole('button', { name: /enviar link/i }));

    expect(
      await screen.findByText(/verifique seu e-mail/i)
    ).toBeInTheDocument();
  });
});
