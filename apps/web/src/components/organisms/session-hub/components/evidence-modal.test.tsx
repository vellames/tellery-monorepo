import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EvidenceModal } from '@/components/organisms/session-hub/components/evidence-modal';
import { renderWithProviders } from '@/test-utils';
import type { SessionClue } from '@/lib/types/session';

const baseProps = {
  cluesTotal: 4,
  requiredCluesFound: 1,
  requiredCluesTotal: 2,
  questionedCount: 1,
  questionedTotal: 3,
  exploredCount: 0,
  exploredTotal: 2,
  progressPct: 25,
  heading: 'Evidências coletadas',
  emptyText: 'Nenhuma evidência ainda.',
  closeLabel: 'Fechar',
  statClues: 'pistas',
  statPeople: 'pessoas',
  statPlaces: 'lugares',
  requiredEvidenceLabel: 'Pistas obrigatórias',
  optionalEvidenceLabel: 'Pistas complementares',
  progressLabel: 'Progresso',
};

describe('EvidenceModal', () => {
  it('shows the empty state when there are no clues', () => {
    renderWithProviders(
      <EvidenceModal {...baseProps} clues={[]} onClose={vi.fn()} />
    );

    expect(screen.getByText('Nenhuma evidência ainda.')).toBeInTheDocument();
  });

  it('groups required and optional clues into sections', () => {
    const clues: SessionClue[] = [
      {
        id: 'clue-1',
        title: 'Tinta azul',
        description: 'desc',
        importance: 'required',
        discoveredAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'clue-2',
        title: 'Café derramado',
        description: 'desc',
        importance: 'optional',
        discoveredAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    renderWithProviders(
      <EvidenceModal {...baseProps} clues={clues} onClose={vi.fn()} />
    );

    expect(screen.getByText('Pistas obrigatórias')).toBeInTheDocument();
    expect(screen.getByText('Pistas complementares')).toBeInTheDocument();
    expect(screen.getByText('Tinta azul')).toBeInTheDocument();
    expect(screen.getByText('Café derramado')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <EvidenceModal {...baseProps} clues={[]} onClose={onClose} />
    );

    const closeButtons = screen.getAllByLabelText('Fechar');
    await user.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
