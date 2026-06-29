import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CaseModal } from '@/components/organisms/session-hub/components/case-modal';
import { renderWithProviders } from '@/test-utils';

const baseProps = {
  opening: 'Uma chuva leve batia nos vidros.',
  objective: 'Descobrir quem deixou o bilhete.',
  briefingLabel: 'Briefing',
  objectiveLabel: 'Objetivo',
  closeLabel: 'Fechar',
};

describe('CaseModal', () => {
  it('renders the opening and objective', () => {
    renderWithProviders(<CaseModal {...baseProps} onClose={vi.fn()} />);

    expect(
      screen.getByText('Uma chuva leve batia nos vidros.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Descobrir quem deixou o bilhete.')
    ).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<CaseModal {...baseProps} onClose={onClose} />);

    const closeButtons = screen.getAllByLabelText('Fechar');
    await user.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
