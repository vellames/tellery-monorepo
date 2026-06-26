import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BottomNav } from '@/components/organisms/bottom-nav/bottom-nav';
import { renderWithProviders } from '@/test-utils';

describe('BottomNav', () => {
  it('renders all three nav items in pt-BR', () => {
    renderWithProviders(<BottomNav />, { locale: 'pt-BR' });

    expect(screen.getByText('Histórias')).toBeInTheDocument();
    expect(screen.getByText('Minha jornada')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('renders English translations when locale is en', () => {
    renderWithProviders(<BottomNav />, { locale: 'en' });

    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('My journey')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('marks the active item with bold styling', () => {
    renderWithProviders(<BottomNav />);

    const storiesButton = screen.getByText('Histórias').closest('button');
    expect(storiesButton).toHaveClass('font-bold', 'text-primary');
  });

  it('renders the mobile menu button with aria-label', () => {
    renderWithProviders(<BottomNav />, { locale: 'pt-BR' });

    expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();
  });
});
