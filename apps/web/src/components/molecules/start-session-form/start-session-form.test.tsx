import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const actionMock = vi.fn();

vi.mock('@/lib/actions/session', () => ({
  startSessionAction: (...args: unknown[]) => actionMock(...args),
}));
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { toast } from 'sonner';
import { StartSessionForm } from '@/components/molecules/start-session-form/start-session-form';
import { renderWithProviders } from '@/test-utils';

describe('StartSessionForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the submit button', () => {
    renderWithProviders(<StartSessionForm historyId="history-1" />);

    expect(
      screen.getByRole('button', { name: /iniciar história/i })
    ).toBeInTheDocument();
  });

  it('toasts the action error after a failed submit', async () => {
    actionMock.mockResolvedValue({ error: 'Você não tem sessões disponíveis' });
    const user = userEvent.setup();
    renderWithProviders(<StartSessionForm historyId="history-1" />);

    await user.click(screen.getByRole('button', { name: /iniciar história/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Você não tem sessões disponíveis'
      )
    );
  });
});
