import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));
vi.mock('@/lib/api/auth', () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

import { logoutRequest } from '@/lib/api/auth';
import { LogoutButton } from '@/components/organisms/logout-button/logout-button';
import { renderWithProviders } from '@/test-utils';

describe('LogoutButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('logs out and redirects to login', async () => {
    vi.mocked(logoutRequest).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /sair/i }));

    await waitFor(() => expect(logoutRequest).toHaveBeenCalled());
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
