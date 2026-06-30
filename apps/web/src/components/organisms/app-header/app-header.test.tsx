import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { AppHeader } from '@/components/organisms/app-header/app-header';
import { renderWithProviders } from '@/test-utils';
import type { User } from '@/lib/types/auth';

const mockUser: User = {
  id: '1',
  name: 'Cassiano',
  email: 'cassiano@example.com',
  availableCredits: 7,
  createdAt: '',
  updatedAt: '',
};

describe('AppHeader', () => {
  it('renders the tagline and sessions badge', () => {
    renderWithProviders(<AppHeader user={mockUser} />, {
      locale: 'pt-BR',
    });

    expect(
      screen.getByText('Histórias onde você participa')
    ).toBeInTheDocument();
    expect(screen.getByText('7 créditos disponíveis')).toBeInTheDocument();
  });

  it('shows the first letter of the user name in the avatar', () => {
    renderWithProviders(<AppHeader user={mockUser} />);

    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders English translations when locale is en', () => {
    renderWithProviders(<AppHeader user={mockUser} />, { locale: 'en' });

    expect(screen.getByText('Stories you take part in')).toBeInTheDocument();
    expect(screen.getByText('7 credits available')).toBeInTheDocument();
  });
});
