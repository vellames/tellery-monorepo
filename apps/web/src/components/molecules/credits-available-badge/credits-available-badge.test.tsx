import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { CreditsAvailableBadge } from '@/components/molecules/credits-available-badge/credits-available-badge';
import { renderWithProviders } from '@/test-utils';

describe('CreditsAvailableBadge', () => {
  it('renders the count in Portuguese', () => {
    renderWithProviders(<CreditsAvailableBadge count={20} />, {
      locale: 'pt-BR',
    });

    expect(screen.getByText('20 créditos disponíveis')).toBeInTheDocument();
  });

  it('renders the count in English', () => {
    renderWithProviders(<CreditsAvailableBadge count={20} />, {
      locale: 'en',
    });

    expect(screen.getByText('20 credits available')).toBeInTheDocument();
  });
});
