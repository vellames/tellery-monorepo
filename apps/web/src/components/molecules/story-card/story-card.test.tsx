import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));

import { StoryCard } from '@/components/molecules/story-card/story-card';
import { renderWithProviders } from '@/test-utils';
import type { History } from '@/lib/types/history';

const freeHistory: History = {
  id: '1',
  slug: 'o-ultimo-quarto',
  title: 'O Último Quarto',
  subtitle: null,
  teaser: 'Um quarto trancado por décadas.',
  genre: 'mystery',
  estimatedDurationMinutes: 15,
  isFree: true,
  coverImageUrl: null,
  thumbnailUrl: null,
};

const premiumHistory: History = {
  id: '2',
  slug: 'a-carta',
  title: 'A Carta Sem Remetente',
  subtitle: null,
  teaser: 'Uma carta chega sem remetente.',
  genre: 'suspense',
  estimatedDurationMinutes: 10,
  isFree: false,
  coverImageUrl: 'https://example.com/cover.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
};

describe('StoryCard', () => {
  it('renders the title, genre and duration', () => {
    renderWithProviders(<StoryCard history={freeHistory} />);

    expect(screen.getByText('O Último Quarto')).toBeInTheDocument();
    expect(screen.getByText('Mistério')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('shows the free label for free stories', () => {
    renderWithProviders(<StoryCard history={freeHistory} />);

    expect(screen.getByText('Grátis')).toBeInTheDocument();
  });

  it('shows the premium label and lock for paid stories', () => {
    renderWithProviders(<StoryCard history={premiumHistory} />);

    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('A Carta Sem Remetente')).toBeInTheDocument();
  });

  it('renders the thumbnail image when available', () => {
    renderWithProviders(<StoryCard history={premiumHistory} />);

    expect(screen.getByLabelText('A Carta Sem Remetente')).toBeInTheDocument();
  });

  it('shows the featured badge when featured', () => {
    renderWithProviders(<StoryCard history={freeHistory} featured />);

    expect(screen.getByText('Destaque')).toBeInTheDocument();
  });

  it('does not show the featured badge by default', () => {
    renderWithProviders(<StoryCard history={freeHistory} />);

    expect(screen.queryByText('Destaque')).not.toBeInTheDocument();
  });
});
