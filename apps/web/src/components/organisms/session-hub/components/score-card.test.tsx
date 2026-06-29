import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Award } from 'lucide-react';

import { ScoreCard } from '@/components/organisms/session-hub/components/score-card';
import { renderWithProviders } from '@/test-utils';

describe('ScoreCard', () => {
  it('renders the label, value and total', () => {
    renderWithProviders(
      <ScoreCard icon={Award} label="Respostas corretas" value={3} total={5} />
    );

    expect(screen.getByText('Respostas corretas')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/5')).toBeInTheDocument();
  });

  it('renders a progress bar with the computed percentage', () => {
    const { container } = renderWithProviders(
      <ScoreCard icon={Award} label="Score" value={2} total={4} />
    );

    const bar = container.querySelector('[style*="width"]');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('style')).toContain('50%');
  });
});
