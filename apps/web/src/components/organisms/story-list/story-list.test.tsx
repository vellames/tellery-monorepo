import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { StoryList } from '@/components/organisms/story-list/story-list';
import { renderWithProviders } from '@/test-utils';
import type { History } from '@/lib/types/history';

const histories: History[] = [
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
  it('renders the section title and a card per history', () => {
    renderWithProviders(<StoryList histories={histories} />);

    expect(screen.getByText('Próximas histórias')).toBeInTheDocument();
    expect(screen.getByText('O Último Quarto')).toBeInTheDocument();
    expect(screen.getByText('A Carta Sem Remetente')).toBeInTheDocument();
  });

  it('renders the see all button', () => {
    renderWithProviders(<StoryList histories={histories} />);

    expect(screen.getByText('Ver todas')).toBeInTheDocument();
  });

  it('renders nothing when histories is empty', () => {
    const { container } = renderWithProviders(<StoryList histories={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
