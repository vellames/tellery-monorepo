import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { changePasswordRequest, updateProfileRequest } from '@/lib/api/profile';
import type { User } from '@/lib/types/auth';

const user: User = {
  id: '1',
  name: 'Ana Updated',
  email: 'ana.updated@b.c',
  createdAt: '',
  updatedAt: '',
};

describe('updateProfileRequest', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns the user on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user }), { status: 200 })
    );

    const result = await updateProfileRequest({
      name: 'Ana Updated',
      email: 'ana.updated@b.c',
    });

    expect(result).toEqual(user);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ana Updated',
          email: 'ana.updated@b.c',
        }),
      })
    );
  });

  it('throws the error message when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Email already in use' }), {
        status: 409,
      })
    );

    await expect(
      updateProfileRequest({ name: 'Ana', email: 'taken@b.c' })
    ).rejects.toThrow('Email already in use');
  });
});

describe('changePasswordRequest', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('resolves on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    await expect(
      changePasswordRequest({
        currentPassword: 'old-pass',
        newPassword: 'new-password',
      })
    ).resolves.toBeUndefined();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/me/password',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'old-pass',
          newPassword: 'new-password',
        }),
      })
    );
  });

  it('throws the error message when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
        status: 401,
      })
    );

    await expect(
      changePasswordRequest({
        currentPassword: 'wrong',
        newPassword: 'new-password',
      })
    ).rejects.toThrow('Current password is incorrect');
  });
});
