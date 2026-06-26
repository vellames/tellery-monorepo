import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { HowItWorks } from '@/components/organisms/how-it-works/how-it-works';
import { renderWithProviders } from '@/test-utils';

describe('HowItWorks', () => {
  it('renders the section title and all three steps in pt-BR', () => {
    renderWithProviders(<HowItWorks />, { locale: 'pt-BR' });

    expect(screen.getByText('Como funciona')).toBeInTheDocument();
    expect(screen.getByText('Entre em uma história')).toBeInTheDocument();
    expect(screen.getByText('Converse com personagens')).toBeInTheDocument();
    expect(screen.getByText('Descubra o final')).toBeInTheDocument();
  });

  it('renders English translations when locale is en', () => {
    renderWithProviders(<HowItWorks />, { locale: 'en' });

    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('Enter a story')).toBeInTheDocument();
    expect(screen.getByText('Talk to characters')).toBeInTheDocument();
    expect(screen.getByText('Find the ending')).toBeInTheDocument();
  });

  it('renders numbered badges for each step', () => {
    renderWithProviders(<HowItWorks />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
