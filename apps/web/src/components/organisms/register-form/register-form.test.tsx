import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
