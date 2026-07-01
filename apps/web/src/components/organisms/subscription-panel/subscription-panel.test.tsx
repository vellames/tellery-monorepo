import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/api/auth', () => ({
  resendVerificationRequest: vi.fn(),
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

function renderPanel(emailVerifiedAt?: string | null) {
  return renderWithProviders(
    <SubscriptionPanel
      plan={plan}
      subscription={null}
      locale="pt-BR"
      emailVerifiedAt={emailVerifiedAt ?? null}
    />
  );
}

describe('SubscriptionPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks checkout and opens the verify dialog when email is not verified', async () => {
    const mutate = mockCheckout();
    vi.mocked(resendVerificationRequest).mockResolvedValue();
    const user = userEvent.setup();
    renderPanel(null);

    await user.click(screen.getByRole('button', { name: /assinar/i }));

    expect(mutate).not.toHaveBeenCalled();
    expect(resendVerificationRequest).toHaveBeenCalled();
    expect(
      await screen.findByText(/verifique seu e-mail para assinar/i)
    ).toBeInTheDocument();
  });

  it('starts checkout when the email is verified', async () => {
    const mutate = mockCheckout();
    const user = userEvent.setup();
    renderPanel('2026-07-01T00:00:00.000Z');

    await user.click(screen.getByRole('button', { name: /assinar/i }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(resendVerificationRequest).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/verifique seu e-mail para assinar/i)
    ).not.toBeInTheDocument();
  });
});
