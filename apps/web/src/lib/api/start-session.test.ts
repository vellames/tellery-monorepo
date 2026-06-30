import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startSessionRequest } from '@/lib/api/start-session';

describe('startSessionRequest', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns the sessionId on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ sessionId: 'session-1' }), { status: 200 })
    );

    const result = await startSessionRequest('history-1');

    expect(result).toEqual({ sessionId: 'session-1' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/session/start',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId: 'history-1' }),
      })
    );
  });

  it('throws the error message when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'You have no sessions available' }),
        {
          status: 402,
        }
      )
    );

    await expect(startSessionRequest('history-1')).rejects.toThrow(
      'You have no sessions available'
    );
  });
});
