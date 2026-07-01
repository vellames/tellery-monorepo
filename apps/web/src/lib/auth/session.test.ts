import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = {
  set: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => store),
}));

import {
  clearSession,
  getSessionUser,
  setSession,
  updateSessionUser,
} from '@/lib/auth/session';
import type { User } from '@/lib/types/auth';

const user: User = {
  id: '1',
  name: 'Ana',
  email: 'a@b.c',
  ssn: null,
  emailVerifiedAt: null,
  createdAt: '',
  updatedAt: '',
};

describe('session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('setSession writes the httpOnly session cookie and the readable user cookie', async () => {
    await setSession('tok', user);

    expect(store.set).toHaveBeenCalledWith(
      'ai-history.session',
      'tok',
      expect.objectContaining({ httpOnly: true })
    );
    expect(store.set).toHaveBeenCalledWith(
      'ai-history.user',
      JSON.stringify(user),
      expect.objectContaining({ httpOnly: false })
    );
  });

  it('clearSession deletes both cookies', async () => {
    await clearSession();

    expect(store.delete).toHaveBeenCalledWith('ai-history.session');
    expect(store.delete).toHaveBeenCalledWith('ai-history.user');
  });

  it('getSessionUser returns the parsed user', async () => {
    store.get.mockReturnValue({ value: JSON.stringify(user) });

    await expect(getSessionUser()).resolves.toEqual(user);
  });

  it('getSessionUser returns null when there is no cookie', async () => {
    store.get.mockReturnValue(undefined);

    await expect(getSessionUser()).resolves.toBeNull();
  });

  it('updateSessionUser refreshes only the readable user cookie', async () => {
    await updateSessionUser(user);

    expect(store.set).toHaveBeenCalledWith(
      'ai-history.user',
      JSON.stringify(user),
      expect.objectContaining({ httpOnly: false })
    );
    expect(store.set).not.toHaveBeenCalledWith(
      'ai-history.session',
      expect.anything(),
      expect.anything()
    );
  });
});
