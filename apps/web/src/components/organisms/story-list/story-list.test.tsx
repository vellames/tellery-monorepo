import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { StoryList } from '@/components/organisms/story-list/story-list';
import { renderWithProviders } from '@/test-utils';
import type { Story } from '@/lib/types/story';

const stories: Story[] = [
  {
    id: '1',
    slug: 'o-ultimo-quarto',
    title: 'O Último Quarto',
    subtitle: null,
    teaser: 'Um quarto trancado.',
    genre: 'mystery',
    estimatedDurationMinutes: 15,
    isFree: false,
    coverImageUrl: null,
    thumbnailUrl: null,
  },
  {
    id: '2',
    slug: 'a-carta',
    title: 'A Carta Sem Remetente',
    subtitle: null,
    teaser: 'Uma carta chega.',
    genre: 'suspense',
    estimatedDurationMinutes: 10,
    isFree: true,
    coverImageUrl: null,
    thumbnailUrl: null,
  },
];

describe('StoryList', () => {
  it('renders the section title and a card per story', () => {
    renderWithProviders(<StoryList stories={stories} />);

    expect(screen.getByText('Próximas histórias')).toBeInTheDocument();
    expect(screen.getByText('O Último Quarto')).toBeInTheDocument();
    expect(screen.getByText('A Carta Sem Remetente')).toBeInTheDocument();
  });

  it('renders the see all link to the stories page', () => {
    renderWithProviders(<StoryList stories={stories} />);

    const seeAll = screen.getByText('Ver todas').closest('a');
    expect(seeAll).toHaveAttribute('href', '/stories');
  });

  it('renders nothing when stories is empty', () => {
    const { container } = renderWithProviders(<StoryList stories={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
