import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('@/lib/hooks/use-available-credits', () => ({
  useAvailableCredits: () => ({ data: 20, isLoading: false }),
}));

import { CreditsAvailableBadge } from '@/components/molecules/credits-available-badge/credits-available-badge';
import { renderWithProviders } from '@/test-utils';

describe('CreditsAvailableBadge', () => {
  it('renders the count in Portuguese', () => {
    renderWithProviders(<CreditsAvailableBadge />, {
      locale: 'pt-BR',
    });

    expect(screen.getByText('20 créditos disponíveis')).toBeInTheDocument();
  });

  it('renders the count in English', () => {
    renderWithProviders(<CreditsAvailableBadge />, {
      locale: 'en',
    });

    expect(screen.getByText('20 credits available')).toBeInTheDocument();
  });
});
