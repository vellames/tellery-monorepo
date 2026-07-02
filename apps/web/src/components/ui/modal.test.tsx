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

  describe('scene variant', () => {
    it('applies the dark immersive panel and backdrop classes', () => {
      renderWithProviders(
        <Modal variant="scene" open onClose={vi.fn()} closeLabel="Close">
          <p>x</p>
        </Modal>
      );

      const panel = screen.getByText('x').parentElement!;
      expect(panel.className).toContain('bg-[#1b070b]');
      expect(panel.className).toContain('border-[#fff9ef]/12');

      const backdrop = document.body.querySelector('button')!;
      expect(backdrop.className).toContain('bg-[#0a0203]/80');
    });

    it('applies the scene entrance animations', () => {
      renderWithProviders(
        <Modal variant="scene" open onClose={vi.fn()}>
          <p>x</p>
        </Modal>
      );

      const backdrop = document.body.querySelector('button')!;
      expect(backdrop.getAttribute('style')).toContain('scene-fade-in');

      const panel = screen.getByText('x').parentElement!;
      expect(panel.getAttribute('style')).toContain('scene-fade-up');
    });

    it('renders the dark circular close button when closeLabel is provided', () => {
      renderWithProviders(
        <Modal variant="scene" open onClose={vi.fn()} closeLabel="Close">
          <p>x</p>
        </Modal>
      );

      const panel = screen.getByText('x').parentElement!;
      const closeButton = panel.querySelector('button')!;
      expect(closeButton.className).toContain('border-[#fff9ef]/15');
      expect(closeButton.className).toContain('bg-black/40');
    });

    it('exposes ariaLabel on the dialog', () => {
      renderWithProviders(
        <Modal variant="scene" open onClose={vi.fn()} ariaLabel="Briefing">
          <p>x</p>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-label',
        'Briefing'
      );
    });

    it('uses the bottom-sheet layout on mobile', () => {
      renderWithProviders(
        <Modal variant="scene" open onClose={vi.fn()}>
          <p>x</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('items-end');
      expect(dialog.className).toContain('sm:items-center');
    });

    it('merges consumer className into the panel', () => {
      renderWithProviders(
        <Modal
          variant="scene"
          open
          onClose={vi.fn()}
          className="scene-grain flex h-[85svh] flex-col"
        >
          <p>x</p>
        </Modal>
      );

      const panel = screen.getByText('x').parentElement!;
      expect(panel.className).toContain('scene-grain');
      expect(panel.className).toContain('h-[85svh]');
    });
  });

  describe('light variant (default)', () => {
    it('keeps the centered white-card layout', () => {
      renderWithProviders(
        <Modal open onClose={vi.fn()}>
          <p>x</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('items-center');

      const panel = screen.getByText('x').parentElement!;
      expect(panel.className).toContain('bg-white');
      expect(panel.className).not.toContain('bg-[#1b070b]');
    });

    it('does not apply scene animations', () => {
      renderWithProviders(
        <Modal open onClose={vi.fn()}>
          <p>x</p>
        </Modal>
      );

      const backdrop = document.body.querySelector('button')!;
      expect(backdrop.getAttribute('style') ?? '').not.toContain('scene-fade');
    });

    it('does not set aria-label when ariaLabel is omitted', () => {
      renderWithProviders(
        <Modal open onClose={vi.fn()}>
          <p>x</p>
        </Modal>
      );

      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
    });
  });
});
