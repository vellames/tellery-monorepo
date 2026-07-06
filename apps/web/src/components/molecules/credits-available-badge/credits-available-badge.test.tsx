import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/hooks/use-available-credits', () => ({
  useAvailableCredits: () => ({ data: 20, isLoading: false }),
}));

import { CreditsAvailableBadge } from '@/components/molecules/credits-available-badge/credits-available-badge';
import { renderWithProviders } from '@/test-utils';

describe('CreditsAvailableBadge', () => {
  it('renders the number and full label', () => {
    renderWithProviders(<CreditsAvailableBadge />, {
      locale: 'pt-BR',
    });

    // Mobile: number only
    expect(screen.getByText('20')).toBeInTheDocument();
    // Desktop: full label
    expect(screen.getByText('20 créditos disponíveis')).toBeInTheDocument();
  });

  it('opens a modal with the credit count on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreditsAvailableBadge />, {
      locale: 'en',
    });

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Your credits')).toBeInTheDocument();
    expect(
      screen.getByText('You have 20 available credits.')
    ).toBeInTheDocument();
  });

  it('does not render a subscribe link in the modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreditsAvailableBadge />, { locale: 'en' });

    await user.click(screen.getByRole('button'));

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
