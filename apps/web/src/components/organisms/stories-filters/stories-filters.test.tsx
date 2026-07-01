import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StoriesFilters } from '@/components/organisms/stories-filters/stories-filters';
import { renderWithProviders } from '@/test-utils';

const mockReplace = vi.fn();
const mockPathname = '/stories';
let currentSearchParams: URLSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => currentSearchParams,
}));

function setSearchParams(query: string) {
  currentSearchParams = new URLSearchParams(query);
}

function getFreePill() {
  return screen.getByRole('button', { name: /grátis/i });
}
function getPremiumPill() {
  return screen.getByRole('button', { name: /premium/i });
}

describe('StoriesFilters', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    setSearchParams('');
  });

  it('marks both pills as pressed when isFree is absent', () => {
    setSearchParams('');
    renderWithProviders(<StoriesFilters />);

    expect(getFreePill()).toHaveAttribute('aria-pressed', 'true');
    expect(getPremiumPill()).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks only the free pill as pressed when isFree=true', () => {
    setSearchParams('isFree=true');
    renderWithProviders(<StoriesFilters />);

    expect(getFreePill()).toHaveAttribute('aria-pressed', 'true');
    expect(getPremiumPill()).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks only the premium pill as pressed when isFree=false', () => {
    setSearchParams('isFree=false');
    renderWithProviders(<StoriesFilters />);

    expect(getFreePill()).toHaveAttribute('aria-pressed', 'false');
    expect(getPremiumPill()).toHaveAttribute('aria-pressed', 'true');
  });

  it('selects free only when clicking free from the default state', async () => {
    const user = userEvent.setup();
    setSearchParams('');
    renderWithProviders(<StoriesFilters />);

    await user.click(getFreePill());

    expect(mockReplace).toHaveBeenCalledWith('/stories?isFree=true');
  });

  it('selects premium only when clicking premium from the default state', async () => {
    const user = userEvent.setup();
    setSearchParams('');
    renderWithProviders(<StoriesFilters />);

    await user.click(getPremiumPill());

    expect(mockReplace).toHaveBeenCalledWith('/stories?isFree=false');
  });

  it('clears back to all when clicking the active free filter again', async () => {
    const user = userEvent.setup();
    setSearchParams('isFree=true');
    renderWithProviders(<StoriesFilters />);

    await user.click(getFreePill());

    expect(mockReplace).toHaveBeenCalledWith('/stories');
  });

  it('switches to premium only when clicking premium from free only', async () => {
    const user = userEvent.setup();
    setSearchParams('isFree=true');
    renderWithProviders(<StoriesFilters />);

    await user.click(getPremiumPill());

    expect(mockReplace).toHaveBeenCalledWith('/stories?isFree=false');
  });

  it('clears back to all when clicking the active premium filter again', async () => {
    const user = userEvent.setup();
    setSearchParams('isFree=false');
    renderWithProviders(<StoriesFilters />);

    await user.click(getPremiumPill());

    expect(mockReplace).toHaveBeenCalledWith('/stories');
  });

  it('switches to free only when clicking free from premium only', async () => {
    const user = userEvent.setup();
    setSearchParams('isFree=false');
    renderWithProviders(<StoriesFilters />);

    await user.click(getFreePill());

    expect(mockReplace).toHaveBeenCalledWith('/stories?isFree=true');
  });
});
