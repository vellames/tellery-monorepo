import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog } from '@/components/molecules/confirm-dialog/confirm-dialog';
import { renderWithProviders } from '@/test-utils';

describe('ConfirmDialog', () => {
  it('opens via the trigger and confirms in uncontrolled mode', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ConfirmDialog
        trigger={<span>delete</span>}
        title="Are you sure?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByText('delete'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing when closed in controlled mode', () => {
    renderWithProviders(
      <ConfirmDialog
        open={false}
        onOpenChange={vi.fn()}
        title="t"
        description="d"
        confirmLabel="ok"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders only the confirm button when cancelLabel is omitted', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="t"
        description="d"
        confirmLabel="Got it"
        closeLabel="Close"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /cancel/i })
    ).not.toBeInTheDocument();
  });

  it('calls onOpenChange(false) on Escape in controlled mode', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="t"
        description="d"
        confirmLabel="ok"
        cancelLabel="close"
        onConfirm={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
