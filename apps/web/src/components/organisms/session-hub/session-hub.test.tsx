import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <div role="img" aria-label={alt} data-src={src} />
  ),
}));

import { SessionHub } from '@/components/organisms/session-hub/session-hub';
import { renderWithProviders } from '@/test-utils';
import type { SessionState } from '@/lib/types/session';

const session: SessionState = {
  id: 'session-1',
  status: 'active',
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
  history: {
    id: 'history-1',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    teaser: 'teaser',
    opening: 'Uma chuva leve batia nos vidros do Café Aurora.',
    objective: 'Descobrir quem deixou o bilhete.',
    genre: 'mystery',
    coverImageUrl: null,
    thumbnailUrl: null,
  },
  clues: [
    {
      id: 'clue-1',
      title: 'Tinta azul',
      description: 'desc',
      importance: 'relevant',
      discoveredAt: '2026-01-02T00:00:00.000Z',
    },
  ],
  cluesTotal: 4,
  characters: [
    {
      id: 'char-1',
      name: 'Elisa',
      role: 'Dona do café',
      shortDescription: 'Cuidadosa com o ambiente.',
      imageUrl: null,
      conversationSummary: null,
      cluesTotal: 2,
      discoveredClues: [],
      messages: [],
    },
  ],
  objects: [],
  locations: [
    {
      id: 'loc-1',
      name: 'Mesa 7',
      shortDescription: 'Onde o bilhete foi encontrado.',
      imageUrl: null,
      initialDescription: 'perto da janela',
      visited: false,
      visitedAt: null,
      cluesTotal: 1,
      discoveredClues: [],
    },
  ],
};

describe('SessionHub', () => {
  it('renders the title, opening and objective', () => {
    renderWithProviders(<SessionHub session={session} />);

    expect(screen.getByText('O Bilhete na Mesa 7')).toBeInTheDocument();
    expect(
      screen.getByText('Uma chuva leve batia nos vidros do Café Aurora.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Descobrir quem deixou o bilhete.')
    ).toBeInTheDocument();
  });

  it('renders the clue progress', () => {
    renderWithProviders(<SessionHub session={session} />);

    expect(screen.getByText('1 de 4 pistas encontradas')).toBeInTheDocument();
  });

  it('renders people and places sections', () => {
    renderWithProviders(<SessionHub session={session} />);

    expect(screen.getByText('Pessoas')).toBeInTheDocument();
    expect(screen.getByText('Elisa')).toBeInTheDocument();
    expect(screen.getByText('Dona do café')).toBeInTheDocument();
    expect(screen.getByText('Lugares')).toBeInTheDocument();
    expect(screen.getByText('Mesa 7')).toBeInTheDocument();
  });

  it('renders character images when available', () => {
    const withImage: SessionState = {
      ...session,
      characters: [
        {
          ...session.characters[0],
          imageUrl: 'https://example.com/elisa.png',
        },
      ],
    };

    renderWithProviders(<SessionHub session={withImage} />);

    expect(screen.getByLabelText('Elisa')).toHaveAttribute(
      'data-src',
      'https://example.com/elisa.png'
    );
  });
});
