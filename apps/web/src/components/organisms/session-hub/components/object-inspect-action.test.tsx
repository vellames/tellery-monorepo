import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ObjectInspectAction } from '@/components/organisms/session-hub/components/object-inspect-action';
import { renderWithProviders } from '@/test-utils';

describe('ObjectInspectAction', () => {
  it('renders the inspect button', () => {
    renderWithProviders(
      <ObjectInspectAction isSending={false} onInspect={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: /Inspeção/ })
    ).toBeInTheDocument();
  });

  it('calls onInspect when clicked', async () => {
    const user = userEvent.setup();
    const onInspect = vi.fn();
    renderWithProviders(
      <ObjectInspectAction isSending={false} onInspect={onInspect} />
    );

    await user.click(screen.getByRole('button'));

    expect(onInspect).toHaveBeenCalledOnce();
  });

  it('disables the button and shows spinner when sending', () => {
    renderWithProviders(<ObjectInspectAction isSending onInspect={vi.fn()} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
