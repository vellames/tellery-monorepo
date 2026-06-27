import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));

import { FeaturedStory } from '@/components/organisms/featured-story/featured-story';
import { renderWithProviders } from '@/test-utils';
import type { History } from '@/lib/types/history';

const mockHistories: History[] = [
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
    renderWithProviders(<FeaturedStory histories={mockHistories} />);

    expect(screen.getByText('O Bilhete na Mesa 7')).toBeInTheDocument();
    expect(
      screen.getByText('Um bilhete anônimo aparece no café.')
    ).toBeInTheDocument();
  });

  it('shows the free label for free stories', () => {
    renderWithProviders(<FeaturedStory histories={mockHistories} />);

    expect(screen.getByText('Grátis')).toBeInTheDocument();
  });

  it('navigates to the next slide and shows premium label', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeaturedStory histories={mockHistories} />);

    await user.click(screen.getByLabelText('Próximo'));

    expect(screen.getByText('A Carta Sem Remetente')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('wraps around when navigating previous from the first slide', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeaturedStory histories={mockHistories} />);

    await user.click(screen.getByLabelText('Anterior'));

    expect(screen.getByText('A Carta Sem Remetente')).toBeInTheDocument();
  });

  it('navigates via dot indicators', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeaturedStory histories={mockHistories} />);

    await user.click(screen.getByLabelText('Slide 2'));

    expect(screen.getByText('A Carta Sem Remetente')).toBeInTheDocument();
  });

  it('renders nothing when histories is empty', () => {
    const { container } = renderWithProviders(<FeaturedStory histories={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
