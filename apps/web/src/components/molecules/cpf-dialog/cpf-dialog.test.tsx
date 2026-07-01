import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/lib/api/profile', () => ({
  updateProfileRequest: vi.fn(),
  changePasswordRequest: vi.fn(),
}));

import { updateProfileRequest } from '@/lib/api/profile';
import { CpfDialog } from '@/components/molecules/cpf-dialog/cpf-dialog';
import { renderWithProviders } from '@/test-utils';
import type { User } from '@/lib/types/auth';

const user: User = {
  id: '1',
  name: 'Ana',
  email: 'ana@teste.local',
  ssn: null,
  emailVerifiedAt: '2026-07-01T00:00:00.000Z',
  createdAt: '',
  updatedAt: '',
};

const validCpf = '29537995593';

describe('CpfDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when closed', () => {
    const { container } = renderWithProviders(
      <CpfDialog
        open={false}
        onClose={vi.fn()}
        user={user}
        onSuccess={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the title and CPF field when open', () => {
    renderWithProviders(
      <CpfDialog open onClose={vi.fn()} user={user} onSuccess={vi.fn()} />
    );
    expect(screen.getByText(/informe seu cpf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
  });

  it('does not submit an invalid CPF', async () => {
    const userEv = userEvent.setup();
    renderWithProviders(
      <CpfDialog open onClose={vi.fn()} user={user} onSuccess={vi.fn()} />
    );

    await userEv.type(screen.getByLabelText(/cpf/i), '11111111111');
    await userEv.click(
      screen.getByRole('button', { name: /salvar e continuar/i })
    );

    expect(updateProfileRequest).not.toHaveBeenCalled();
    expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
  });

  it('saves the CPF with name and email, then calls onSuccess', async () => {
    vi.mocked(updateProfileRequest).mockResolvedValue(user);
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const userEv = userEvent.setup();
    renderWithProviders(
      <CpfDialog open onClose={onClose} user={user} onSuccess={onSuccess} />
    );

    await userEv.type(screen.getByLabelText(/cpf/i), validCpf);
    await userEv.click(
      screen.getByRole('button', { name: /salvar e continuar/i })
    );

    await waitFor(() =>
      expect(updateProfileRequest).toHaveBeenCalledWith({
        name: 'Ana',
        email: 'ana@teste.local',
        ssn: validCpf,
      })
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });
});
