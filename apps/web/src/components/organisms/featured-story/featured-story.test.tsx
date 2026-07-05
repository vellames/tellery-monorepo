import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FeaturedStory } from '@/components/organisms/featured-story/featured-story';
import { renderWithProviders } from '@/test-utils';
import type { Story } from '@/lib/types/story';

const mockStories: Story[] = [
  {
    id: '1',
    slug: 'o-bilhete-na-mesa-7',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    teaser: 'Um bilhete anônimo aparece no café.',
    genre: 'mystery',
    estimatedDurationMinutes: 10,
    isFree: true,
    coverImageUrl: null,
    thumbnailUrl: null,
  },
  {
    id: '2',
    slug: 'a-carta',
    title: 'A Carta Sem Remetente',
    subtitle: null,
    teaser: 'Uma carta chega sem remetente.',
    genre: 'suspense',
    estimatedDurationMinutes: 15,
    isFree: false,
    coverImageUrl: null,
    thumbnailUrl: null,
  },
];

describe('FeaturedStory', () => {
  it('renders the first story title and teaser', () => {
    renderWithProviders(<FeaturedStory stories={mockStories} />);

    expect(screen.getByText('O Bilhete na Mesa 7')).toBeInTheDocument();
    expect(
      screen.getByText('Um bilhete anônimo aparece no café.')
    ).toBeInTheDocument();
  });

  it('shows the free label for free stories', () => {
    renderWithProviders(<FeaturedStory stories={mockStories} />);

    expect(screen.getByText('Grátis')).toBeInTheDocument();
  });

  it('navigates to the next slide', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <FeaturedStory stories={mockStories} />
    );

    await user.click(screen.getByLabelText('Próximo'));

    expect(getTrackTransform(container)).toContain('-100%');
  });

  it('wraps around when navigating previous from the first slide', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <FeaturedStory stories={mockStories} />
    );

    await user.click(screen.getByLabelText('Anterior'));

    expect(getTrackTransform(container)).toContain('-100%');
  });

  it('navigates via dot indicators', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <FeaturedStory stories={mockStories} />
    );

    await user.click(screen.getByLabelText('Slide 2'));

    expect(getTrackTransform(container)).toContain('-100%');
  });

  it('renders nothing when stories is empty', () => {
    const { container } = renderWithProviders(<FeaturedStory stories={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('auto-advances to the next slide after the interval', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderWithProviders(
        <FeaturedStory stories={mockStories} />
      );

      expect(getTrackTransform(container)).not.toContain('-100%');

      act(() => {
        vi.advanceTimersByTime(12000);
      });

      expect(getTrackTransform(container)).toContain('-100%');
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops auto-advancing after the user manually navigates', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderWithProviders(
        <FeaturedStory stories={mockStories} />
      );

      fireEvent.click(screen.getByLabelText('Próximo'));
      expect(getTrackTransform(container)).toContain('-100%');

      act(() => {
        vi.advanceTimersByTime(12000);
      });

      expect(getTrackTransform(container)).toContain('-100%');
    } finally {
      vi.useRealTimers();
    }
  });
});

function getTrackTransform(container: HTMLElement): string {
  const track = container.querySelector<HTMLElement>('[style*="translateX"]');
  return track?.style.transform ?? '';
}
