import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

import { Modal } from '@/components/ui/modal';
import { renderWithProviders } from '@/test-utils';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderWithProviders(
      <Modal open={false} onClose={vi.fn()}>
        body
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders children when open', () => {
    renderWithProviders(
      <Modal open onClose={vi.fn()}>
        <p>modal body</p>
      </Modal>
    );
    expect(screen.getByText('modal body')).toBeInTheDocument();
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose}>
        <p>x</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on backdrop click', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose}>
        <p>x</p>
      </Modal>
    );

    fireEvent.click(document.body.querySelector('button')!);

    expect(onClose).toHaveBeenCalled();
  });

  it('renders a close button only when closeLabel is provided', () => {
    renderWithProviders(
      <Modal open onClose={vi.fn()} closeLabel="Close">
        <p>x</p>
      </Modal>
    );
    expect(screen.getAllByLabelText('Close').length).toBeGreaterThan(0);
  });
});
