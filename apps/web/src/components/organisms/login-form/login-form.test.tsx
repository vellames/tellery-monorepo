import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/lib/api/auth', () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

import { loginRequest } from '@/lib/api/auth';
import { LoginForm } from '@/components/organisms/login-form/login-form';
import { renderWithProviders } from '@/test-utils';

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/obrigatório/i)).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it('submits email and password', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      id: '1',
      name: '',
      email: '',
      ssn: null,
      emailVerifiedAt: null,
      createdAt: '',
      updatedAt: '',
    });
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('E-mail'), 'a@b.c');
    await user.type(screen.getByLabelText('Senha'), '123456');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() =>
      expect(loginRequest).toHaveBeenCalledWith({
        email: 'a@b.c',
        password: '123456',
      })
    );
  });
});
