import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = { set: vi.fn() };

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => store),
}));

import { setLocale } from '@/i18n/actions';

describe('setLocale', () => {
  beforeEach(() => {
    store.set.mockClear();
  });

  it('writes the requested locale', async () => {
    await setLocale('en');

    expect(store.set).toHaveBeenCalledWith(
      'NEXT_LOCALE',
      'en',
      expect.objectContaining({ path: '/' })
    );
  });

  it('falls back to the default locale for unsupported values', async () => {
    await setLocale('fr' as never);

    expect(store.set).toHaveBeenCalledWith(
      'NEXT_LOCALE',
      'pt-BR',
      expect.any(Object)
    );
  });
});
