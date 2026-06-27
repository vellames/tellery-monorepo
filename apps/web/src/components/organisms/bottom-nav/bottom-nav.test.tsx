import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BottomNav } from '@/components/organisms/bottom-nav/bottom-nav';
import { renderWithProviders } from '@/test-utils';

describe('BottomNav', () => {
  it('renders all four nav items in pt-BR', () => {
    renderWithProviders(<BottomNav />, { locale: 'pt-BR' });

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Histórias')).toBeInTheDocument();
    expect(screen.getByText('Minha jornada')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('renders English translations when locale is en', () => {
    renderWithProviders(<BottomNav />, { locale: 'en' });

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('My journey')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('marks the active item with bold styling', () => {
    renderWithProviders(<BottomNav />, { locale: 'pt-BR' });

    const homeButton = screen.getByText('Início').closest('button');
    expect(homeButton).toHaveClass('font-bold', 'text-primary');
  });
});
