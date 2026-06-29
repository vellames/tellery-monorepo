import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { EvidenceSection } from '@/components/organisms/session-hub/components/evidence-section';
import { renderWithProviders } from '@/test-utils';
import type { SessionClue } from '@/lib/types/session';

const clues: SessionClue[] = [
  {
    id: 'clue-1',
    title: 'Tinta azul',
    description: 'Uma mancha azul.',
    importance: 'required',
    discoveredAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'clue-2',
    title: 'Bilhete',
    description: 'Um bilhete rasgado.',
    importance: 'required',
    discoveredAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('EvidenceSection', () => {
  it('renders the title and clue count', () => {
    renderWithProviders(
      <EvidenceSection title="Pistas obrigatórias" clues={clues} required />
    );

    expect(screen.getByText('Pistas obrigatórias')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders all clue titles', () => {
    renderWithProviders(
      <EvidenceSection title="Pistas obrigatórias" clues={clues} required />
    );

    expect(screen.getByText('Tinta azul')).toBeInTheDocument();
    expect(screen.getByText('Bilhete')).toBeInTheDocument();
  });
});
