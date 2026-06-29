import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CluePill } from '@/components/organisms/session-hub/components/clue-pill';
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
];

const baseProps = {
  found: 1,
  total: 2,
  easyMode: false,
  clues,
  label: 'Pistas encontradas aqui',
  emptyLabel: 'Nenhuma pista encontrada aqui ainda.',
  closeLabel: 'Fechar',
};

describe('CluePill', () => {
  it('shows the found count', () => {
    renderWithProviders(<CluePill {...baseProps} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows found/total in easy mode', () => {
    renderWithProviders(<CluePill {...baseProps} easyMode />);

    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('opens the popover on click and lists clues', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CluePill {...baseProps} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Tinta azul')).toBeInTheDocument();
    expect(screen.getByText('Uma mancha azul.')).toBeInTheDocument();
  });

  it('shows the empty message when there are no clues', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CluePill {...baseProps} found={0} clues={[]} />);

    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('Nenhuma pista encontrada aqui ainda.')
    ).toBeInTheDocument();
  });
});
