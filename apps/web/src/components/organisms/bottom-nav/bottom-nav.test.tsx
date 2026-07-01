import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/home' } }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

import { BottomNav } from '@/components/organisms/bottom-nav/bottom-nav';
import { renderWithProviders } from '@/test-utils';

describe('BottomNav', () => {
  it('renders home, stories and journey in pt-BR', () => {
    renderWithProviders(<BottomNav />, { locale: 'pt-BR' });

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Histórias')).toBeInTheDocument();
    expect(screen.getByText('Minha jornada')).toBeInTheDocument();
    expect(screen.queryByText('Perfil')).not.toBeInTheDocument();
  });

  it('renders English translations when locale is en', () => {
    renderWithProviders(<BottomNav />, { locale: 'en' });

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('My journey')).toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('hides the journey item when the user has no sessions', () => {
    renderWithProviders(<BottomNav hasSessions={false} />, { locale: 'pt-BR' });

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Histórias')).toBeInTheDocument();
    expect(screen.queryByText('Minha jornada')).not.toBeInTheDocument();
  });

  it('marks the home item active on the home route', () => {
    pathname.current = '/home';
    renderWithProviders(<BottomNav />, { locale: 'pt-BR' });

    const homeLink = screen.getByText('Início').closest('a');
    expect(homeLink).toHaveClass('font-bold', 'text-primary');
  });

  it('marks the stories item active on the stories route', () => {
    pathname.current = '/stories';
    renderWithProviders(<BottomNav />, { locale: 'pt-BR' });

    const storiesLink = screen.getByText('Histórias').closest('a');
    expect(storiesLink).toHaveClass('font-bold', 'text-primary');
  });

  it('renders the home and stories items as links', () => {
    renderWithProviders(<BottomNav />, { locale: 'pt-BR' });

    expect(screen.getByText('Início').closest('a')).toHaveAttribute(
      'href',
      '/home'
    );
    expect(screen.getByText('Histórias').closest('a')).toHaveAttribute(
      'href',
      '/stories'
    );
  });
});
