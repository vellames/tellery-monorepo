import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    subtitle: 'Um bilhete sem assinatura',
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
  objects: [
    {
      id: 'obj-1',
      name: 'Guardanapo',
      shortDescription: 'Um guardanapo amassado.',
      imageUrl: null,
      initialDescription: 'Está sobre a mesa.',
      inspected: false,
      inspectedAt: null,
      cluesTotal: 1,
      discoveredClues: [],
      messages: [],
    },
  ],
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

    expect(screen.getByText('1/4')).toBeInTheDocument();
  });

  it('renders the investigation board entities', () => {
    renderWithProviders(<SessionHub session={session} />);

    expect(screen.getByText('Suspeitos e testemunhas')).toBeInTheDocument();
    expect(screen.getByText('Elisa')).toBeInTheDocument();
    expect(screen.getByText('Dona do café')).toBeInTheDocument();
    expect(screen.getByText('Locais')).toBeInTheDocument();
    expect(screen.getByText('Mesa 7')).toBeInTheDocument();
  });

  it('does not list objects on the hub', () => {
    renderWithProviders(<SessionHub session={session} />);

    expect(screen.queryByText('Evidências no local')).not.toBeInTheDocument();
    expect(screen.queryByText('Guardanapo')).not.toBeInTheDocument();
  });

  it('renders collected evidence', () => {
    renderWithProviders(<SessionHub session={session} />);

    expect(screen.getByText('Tinta azul')).toBeInTheDocument();
  });

  it('renders entity images when available', () => {
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

  it('opens the investigation panel when a lead card is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SessionHub session={session} />);

    await user.click(screen.getByText('Elisa'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Interrogatório')).toBeInTheDocument();
    expect(
      screen.getAllByText('Cuidadosa com o ambiente.').length
    ).toBeGreaterThan(0);
  });
});
