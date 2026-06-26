import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/i18n/actions', () => ({ setLocale: vi.fn() }));

import { setLocale } from '@/i18n/actions';
import { LanguageSwitcher } from '@/components/molecules/language-switcher/language-switcher';
import { renderWithProviders } from '@/test-utils';

describe('LanguageSwitcher', () => {
  beforeEach(() => vi.clearAllMocks());

  it('changes the locale to English when selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />, { locale: 'pt-BR' });

    await user.click(screen.getByRole('button', { name: /idioma/i }));
    await user.click(await screen.findByText('English'));

    await waitFor(() => expect(setLocale).toHaveBeenCalledWith('en'));
  });
});
