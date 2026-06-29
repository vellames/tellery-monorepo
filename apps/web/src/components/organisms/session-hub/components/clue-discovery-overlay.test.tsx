import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClueDiscoveryOverlay } from '@/components/organisms/session-hub/components/clue-discovery-overlay';
import { renderWithProviders } from '@/test-utils';
import type { InteractDiscoveredClue } from '@/lib/types/session';

const clues: InteractDiscoveredClue[] = [
  {
    id: 'clue-1',
    title: 'Tinta azul',
    description: 'Uma mancha azul.',
    reasoning: 'Relevant.',
  },
  {
    id: 'clue-2',
    title: 'Bilhete rasgado',
    description: 'Rasgado sob a mesa.',
    reasoning: 'Ambient.',
  },
];

describe('ClueDiscoveryOverlay', () => {
  it('renders all clue titles', () => {
    renderWithProviders(
      <ClueDiscoveryOverlay
        clues={clues}
        heading="Evidência descoberta"
        continueLabel="Continuar"
        onContinue={vi.fn()}
      />
    );

    expect(screen.getByText('Tinta azul')).toBeInTheDocument();
    expect(screen.getByText('Bilhete rasgado')).toBeInTheDocument();
  });

  it('calls onContinue when the continue button is clicked', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    renderWithProviders(
      <ClueDiscoveryOverlay
        clues={clues}
        heading="Evidência descoberta"
        continueLabel="Continuar"
        onContinue={onContinue}
      />
    );

    await user.click(screen.getByText('Continuar'));

    expect(onContinue).toHaveBeenCalledOnce();
  });
});
