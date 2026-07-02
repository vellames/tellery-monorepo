import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LeadCard } from '@/components/organisms/session-hub/components/lead-card';
import { renderWithProviders } from '@/test-utils';

const baseProps = {
  name: 'Elisa',
  description: 'Cuidadosa com o ambiente.',
  cluesLabel: '1 pista',
  assistedMode: false,
  cluesFound: 1,
  cluesTotal: 2,
  done: false,
  doneLabel: 'Questioned',
  pendingLabel: 'Not questioned',
  ctaLabel: 'Tap to question',
  accent: 'rose' as const,
};

describe('LeadCard', () => {
  it('renders name and description', () => {
    renderWithProviders(<LeadCard {...baseProps} onClick={vi.fn()} />);

    expect(screen.getByText('Elisa')).toBeInTheDocument();
    expect(screen.getByText('Cuidadosa com o ambiente.')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<LeadCard {...baseProps} onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows the pending label when not done', () => {
    renderWithProviders(<LeadCard {...baseProps} onClick={vi.fn()} />);

    expect(screen.getByText('Not questioned')).toBeInTheDocument();
  });

  it('shows the done label when done', () => {
    renderWithProviders(<LeadCard {...baseProps} done onClick={vi.fn()} />);

    expect(screen.getByText('Questioned')).toBeInTheDocument();
  });

  it('does not render the assisted-mode progress bar when assistedMode is off', () => {
    const { container } = renderWithProviders(
      <LeadCard {...baseProps} assistedMode={false} onClick={vi.fn()} />
    );

    expect(container.querySelector('[style*="width"]')).toBeNull();
  });

  it('renders the assisted-mode progress bar when assistedMode is on and clues exist', () => {
    const { container } = renderWithProviders(
      <LeadCard
        {...baseProps}
        assistedMode
        cluesTotal={2}
        cluesFound={1}
        onClick={vi.fn()}
      />
    );

    const bar = container.querySelector('[style*="width"]');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('style')).toContain('50%');
  });
});
