import { describe, expect, it, vi } from 'vitest';
import {
  loginRequest,
  logoutRequest,
  registerRequest,
  resendVerificationRequest,
  verifyEmailRequest,
} from '@/lib/api/auth';
import type { User } from '@/lib/types/auth';

const user: User = {
  id: '1',
  name: 'Ana',
  email: 'a@b.c',
  accountType: 'permanent',
  ssn: null,
  emailVerifiedAt: null,
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

  it('registerRequest returns the user on 201', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ user }), { status: 201 })
      );

    await expect(
      registerRequest({ name: 'Ana', email: 'a@b.c', password: '123456' })
    ).resolves.toEqual(user);
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

  it('verifyEmailRequest returns the refreshed user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user }), { status: 200 })
    );

    await expect(verifyEmailRequest('token-abc')).resolves.toEqual(user);
  });

  it('verifyEmailRequest throws on an invalid token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid token' }), { status: 422 })
    );

    await expect(verifyEmailRequest('bad')).rejects.toThrow('Invalid token');
  });

  it('resendVerificationRequest performs a POST', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"success":true}', { status: 200 }));

    await resendVerificationRequest();

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });

  it('logoutRequest performs a POST', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }));

    await logoutRequest();

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });
});
