import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mutateMock = vi.fn();

vi.mock('@/lib/hooks/use-profile', () => ({
  useChangePassword: () => ({ mutate: mutateMock, isPending: false }),
}));

import { ChangePasswordForm } from '@/components/organisms/change-password-form/change-password-form';
import { renderWithProviders } from '@/test-utils';

describe('ChangePasswordForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the three password fields and submit button', () => {
    renderWithProviders(<ChangePasswordForm />);

    expect(screen.getByLabelText('Senha atual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /atualizar senha/i })
    ).toBeInTheDocument();
  });

  it('shows an error when the current password is empty', async () => {
    const evt = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await evt.type(screen.getByLabelText('Nova senha'), 'new-password');
    await evt.type(
      screen.getByLabelText('Confirmar nova senha'),
      'new-password'
    );
    await evt.click(screen.getByRole('button', { name: /atualizar senha/i }));

    expect(
      await screen.findByText(/senha atual é obrigatória/i)
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('shows an error when the new password is shorter than 6 chars', async () => {
    const evt = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await evt.type(screen.getByLabelText('Senha atual'), 'old-pass');
    await evt.type(screen.getByLabelText('Nova senha'), '12345');
    await evt.type(screen.getByLabelText('Confirmar nova senha'), '12345');
    await evt.click(screen.getByRole('button', { name: /atualizar senha/i }));

    expect(
      await screen.findByText(/ao menos 6 caracteres/i)
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('shows an error when the new password equals the current password', async () => {
    const evt = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await evt.type(screen.getByLabelText('Senha atual'), 'same-pass');
    await evt.type(screen.getByLabelText('Nova senha'), 'same-pass');
    await evt.type(screen.getByLabelText('Confirmar nova senha'), 'same-pass');
    await evt.click(screen.getByRole('button', { name: /atualizar senha/i }));

    expect(
      await screen.findByText(/deve ser diferente da senha atual/i)
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('shows an error when the confirmation does not match', async () => {
    const evt = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await evt.type(screen.getByLabelText('Senha atual'), 'old-pass');
    await evt.type(screen.getByLabelText('Nova senha'), 'new-password');
    await evt.type(screen.getByLabelText('Confirmar nova senha'), 'different');
    await evt.click(screen.getByRole('button', { name: /atualizar senha/i }));

    expect(
      await screen.findByText(/as senhas não coincidem/i)
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('submits the current and new passwords', async () => {
    const evt = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await evt.type(screen.getByLabelText('Senha atual'), 'old-pass');
    await evt.type(screen.getByLabelText('Nova senha'), 'new-password');
    await evt.type(
      screen.getByLabelText('Confirmar nova senha'),
      'new-password'
    );
    await evt.click(screen.getByRole('button', { name: /atualizar senha/i }));

    await waitFor(() =>
      expect(mutateMock).toHaveBeenCalledWith(
        { currentPassword: 'old-pass', newPassword: 'new-password' },
        expect.anything()
      )
    );
  });
});
