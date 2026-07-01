import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mutateMock = vi.fn();

vi.mock('@/lib/hooks/use-profile', () => ({
  useUpdateProfile: () => ({ mutate: mutateMock, isPending: false }),
}));

import { ProfileForm } from '@/components/organisms/profile-form/profile-form';
import { renderWithProviders } from '@/test-utils';
import type { User } from '@/lib/types/auth';

const user: User = {
  id: '1',
  name: 'Ana Teste',
  email: 'ana@teste.local',
  ssn: '29537995593',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfileForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prefills the fields with the current user data', () => {
    renderWithProviders(<ProfileForm user={user} />);

    expect(screen.getByLabelText('Nome')).toHaveValue('Ana Teste');
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@teste.local');
    expect(screen.getByLabelText('CPF')).toHaveValue('29537995593');
  });

  it('shows a validation error when the name is cleared', async () => {
    const evt = userEvent.setup();
    renderWithProviders(<ProfileForm user={user} />);

    await evt.clear(screen.getByLabelText('Nome'));
    await evt.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('shows a validation error when the email is invalid', async () => {
    const evt = userEvent.setup();
    renderWithProviders(<ProfileForm user={user} />);

    await evt.clear(screen.getByLabelText('E-mail'));
    await evt.type(screen.getByLabelText('E-mail'), 'not-an-email');
    await evt.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/e-mail inválido/i)).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('submits the name, email, and ssn', async () => {
    const evt = userEvent.setup();
    renderWithProviders(<ProfileForm user={user} />);

    await evt.clear(screen.getByLabelText('Nome'));
    await evt.type(screen.getByLabelText('Nome'), 'Ana Updated');
    await evt.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() =>
      expect(mutateMock).toHaveBeenCalledWith(
        {
          name: 'Ana Updated',
          email: 'ana@teste.local',
          ssn: '29537995593',
        },
        expect.anything()
      )
    );
  });
});
