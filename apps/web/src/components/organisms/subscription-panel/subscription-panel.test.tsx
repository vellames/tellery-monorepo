import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/lib/api/auth', () => ({
  resendVerificationRequest: vi.fn(),
}));
vi.mock('@/lib/api/profile', () => ({
  updateProfileRequest: vi.fn(),
  changePasswordRequest: vi.fn(),
}));
vi.mock('@/lib/hooks/use-subscription', () => ({
  useCreateCheckout: vi.fn(),
  useCreateBillingPortal: vi.fn(),
}));

import { resendVerificationRequest } from '@/lib/api/auth';
import { useCreateCheckout } from '@/lib/hooks/use-subscription';
import { SubscriptionPanel } from '@/components/organisms/subscription-panel/subscription-panel';
import { renderWithProviders } from '@/test-utils';
import type { PlanDisplay } from '@/lib/types/subscription';
import type { User } from '@/lib/types/auth';

const plan: PlanDisplay = {
  id: 'price_1',
  name: 'Premium',
  creditsPerCycle: 30,
  interval: 'month',
  priceId: 'price_1',
  amountInCents: 1990,
  currency: 'BRL',
  active: true,
};

function mockCheckout() {
  const mutate = vi.fn();
  (useCreateCheckout as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    mutate,
    isPending: false,
  });
  return mutate;
}

function renderPanel(userOverrides: Partial<User> = {}) {
  return renderWithProviders(
    <SubscriptionPanel
      plan={plan}
      subscription={null}
      locale="pt-BR"
      user={{
        id: '1',
        name: 'Ana',
        email: 'a@b.c',
        accountType: 'permanent',
        ssn: null,
        emailVerifiedAt: '2026-07-01T00:00:00.000Z',
        createdAt: '',
        updatedAt: '',
        ...userOverrides,
      }}
    />
  );
}

describe('SubscriptionPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks checkout and opens the verify dialog when email is not verified', async () => {
    const mutate = mockCheckout();
    vi.mocked(resendVerificationRequest).mockResolvedValue();
    const user = userEvent.setup();
    renderPanel({ emailVerifiedAt: null });

    await user.click(screen.getByRole('button', { name: /assinar/i }));

    expect(mutate).not.toHaveBeenCalled();
    expect(resendVerificationRequest).toHaveBeenCalled();
    expect(
      await screen.findByText(/verifique seu e-mail para assinar/i)
    ).toBeInTheDocument();
  });

  it('opens the CPF dialog when the email is verified but there is no CPF', async () => {
    const mutate = mockCheckout();
    const user = userEvent.setup();
    renderPanel({ ssn: null });

    await user.click(screen.getByRole('button', { name: /assinar/i }));

    expect(mutate).not.toHaveBeenCalled();
    expect(await screen.findByText(/informe seu cpf/i)).toBeInTheDocument();
  });

  it('starts checkout when the email is verified and a CPF is on file', async () => {
    const mutate = mockCheckout();
    const user = userEvent.setup();
    renderPanel({ ssn: '29537995593' });

    await user.click(screen.getByRole('button', { name: /assinar/i }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(resendVerificationRequest).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/verifique seu e-mail para assinar/i)
    ).not.toBeInTheDocument();
  });
});
