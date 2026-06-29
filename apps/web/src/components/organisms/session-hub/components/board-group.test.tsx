import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Users } from 'lucide-react';

import { BoardGroup } from '@/components/organisms/session-hub/components/board-group';
import { renderWithProviders } from '@/test-utils';

describe('BoardGroup', () => {
  it('renders the title and count', () => {
    renderWithProviders(
      <BoardGroup icon={Users} title="Suspeitos" count={3}>
        <span>child</span>
      </BoardGroup>
    );

    expect(screen.getByText('Suspeitos')).toBeInTheDocument();
    expect(screen.getByText('· 3')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
