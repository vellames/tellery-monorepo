import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SessionsAvailableBadge } from '@/components/molecules/sessions-available-badge/sessions-available-badge';
import { renderWithProviders } from '@/test-utils';

describe('SessionsAvailableBadge', () => {
  it('renders the count in Portuguese', () => {
    renderWithProviders(<SessionsAvailableBadge count={20} />, {
      locale: 'pt-BR',
    });

    expect(screen.getByText('20 sessões disponíveis')).toBeInTheDocument();
  });

  it('renders the count in English', () => {
    renderWithProviders(<SessionsAvailableBadge count={20} />, {
      locale: 'en',
    });

    expect(screen.getByText('20 sessions available')).toBeInTheDocument();
  });
});
