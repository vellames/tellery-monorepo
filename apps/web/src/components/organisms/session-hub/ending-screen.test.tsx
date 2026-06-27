import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { SessionHub } from '@/components/organisms/session-hub/session-hub';
import { renderWithProviders } from '@/test-utils';
import type { SessionState } from '@/lib/types/session';

const baseSession: SessionState = {
  id: 'session-1',
  status: 'active',
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
  history: {
    id: 'history-1',
    title: 'O Bilhete na Mesa 7',
    subtitle: 'Um bilhete sem assinatura',
    teaser: 'teaser',
    opening: 'opening text',
    objective: 'objective text',
    genre: 'mystery',
    coverImageUrl: null,
    thumbnailUrl: null,
  },
  clues: [],
  cluesTotal: 0,
  requiredCluesTotal: 0,
  characters: [],
  objects: [],
  locations: [],
  conclusionFields: [],
  ending: null,
};

describe('SessionHub — ending screen', () => {
  it('renders the ending screen when session is completed', () => {
    const solvedSession: SessionState = {
      ...baseSession,
      status: 'completed',
      completedAt: '2026-01-10T00:00:00.000Z',
      ending: {
        snapshot: {
          endingDefinitionId: 'ending-1',
          title: 'A frase certa para a pessoa certa',
          type: 'full_truth',
          imageUrl: null,
          summary: 'Você reconstruiu a verdade completa.',
          epilogue: 'O silêncio mudou de peso.',
        },
        score: {
          discoveredClues: 10,
          totalClues: 15,
          requiredCluesDiscovered: 8,
          totalRequiredClues: 8,
          correctAnswers: 3,
          totalAnswers: 3,
        },
      },
    };

    renderWithProviders(<SessionHub session={solvedSession} />);

    expect(
      screen.getByText((content, element) =>
        element?.tagName === 'SPAN'
          ? content.includes('Verdade completa')
          : false
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('A frase certa para a pessoa certa')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Você reconstruiu a verdade completa.')
    ).toBeInTheDocument();
    expect(screen.getByText('O silêncio mudou de peso.')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/3')).toBeInTheDocument();
  });

  it('shows the investigation board when session is active', () => {
    renderWithProviders(<SessionHub session={baseSession} />);

    expect(screen.queryByText('Verdade completa')).not.toBeInTheDocument();
  });
});
