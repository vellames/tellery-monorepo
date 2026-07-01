import { describe, expect, it, vi } from 'vitest';
import { loginRequest, logoutRequest, registerRequest } from '@/lib/api/auth';
import type { User } from '@/lib/types/auth';

const user: User = {
  id: '1',
  name: 'Ana',
  email: 'a@b.c',
  createdAt: '',
  updatedAt: '',
};

describe('api/auth', () => {
  it('loginRequest returns the user on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user }), { status: 200 })
    );

    await expect(
      loginRequest({ email: 'a@b.c', password: '123' })
    ).resolves.toEqual(user);
  });

  it('loginRequest throws the server error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid' }), { status: 401 })
    );

    await expect(
      loginRequest({ email: 'a@b.c', password: 'x' })
    ).rejects.toThrow('Invalid');
  });

  it('registerRequest resolves on 201', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"success":true}', { status: 201 }));

    await expect(
      registerRequest({ name: 'Ana', email: 'a@b.c', password: '123456' })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('registerRequest throws on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Email already in use' }), {
        status: 409,
      })
    );

    await expect(
      registerRequest({ name: 'A', email: 'a@b.c', password: '123456' })
    ).rejects.toThrow('Email already in use');
  });

  it('logoutRequest performs a POST', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }));

    await logoutRequest();

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });
});
