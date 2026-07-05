import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { StoryCard } from '@/components/molecules/story-card/story-card';
import { renderWithProviders } from '@/test-utils';
import type { Story } from '@/lib/types/story';

const freeStory: Story = {
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

const premiumStory: Story = {
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
    renderWithProviders(<StoryCard story={freeStory} />);

    expect(screen.getByText('O Último Quarto')).toBeInTheDocument();
    expect(screen.getByText('Mistério')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('links to the story start page', () => {
    renderWithProviders(<StoryCard story={freeStory} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/stories/1');
  });

  it('shows the free label for free stories', () => {
    renderWithProviders(<StoryCard story={freeStory} />);

    expect(screen.getByText('Grátis')).toBeInTheDocument();
  });

  it('shows the premium label and lock for paid stories', () => {
    renderWithProviders(<StoryCard story={premiumStory} />);

    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('A Carta Sem Remetente')).toBeInTheDocument();
  });

  it('renders the thumbnail image when available', () => {
    renderWithProviders(<StoryCard story={premiumStory} />);

    expect(screen.getByAltText('A Carta Sem Remetente')).toBeInTheDocument();
  });

  it('shows the featured badge when featured', () => {
    renderWithProviders(<StoryCard story={freeStory} featured />);

    expect(screen.getByText('Destaque')).toBeInTheDocument();
  });

  it('does not show the featured badge by default', () => {
    renderWithProviders(<StoryCard story={freeStory} />);

    expect(screen.queryByText('Destaque')).not.toBeInTheDocument();
  });
});
