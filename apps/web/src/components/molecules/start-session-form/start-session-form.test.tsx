import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mutateMock = vi.fn();

vi.mock('@/lib/hooks/use-start-session', () => ({
  useStartSession: () => ({ mutate: mutateMock, isPending: false }),
}));

import { StartSessionForm } from '@/components/molecules/start-session-form/start-session-form';
import { renderWithProviders } from '@/test-utils';

describe('StartSessionForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the submit button', () => {
    renderWithProviders(<StartSessionForm storyId="story-1" />);

    expect(
      screen.getByRole('button', { name: /iniciar história/i })
    ).toBeInTheDocument();
  });

  it('starts the session on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StartSessionForm storyId="story-1" />);

    await user.click(screen.getByRole('button', { name: /iniciar história/i }));

    expect(mutateMock).toHaveBeenCalledWith('story-1');
  });
});
