import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { createLeadRequest, updateLeadRequest } from '@/lib/api/leads';
import {
  ApiError,
  EMPTY_RESPONSE_BODY,
  NETWORK_FAILURE_STATUS,
} from '@/lib/api/error';
import type { Lead } from '@/lib/types/lead';

const mockClientFetch = vi.fn();
vi.mock('@/lib/api/client-fetch', () => ({
  clientFetch: (...args: unknown[]) => mockClientFetch(...args),
}));

vi.mock('@/lib/config', () => ({
  config: {
    routes: {
      leadApi: '/api/leads',
      leadDetailApi: (id: string) => `/api/leads/${id}`,
    },
  },
}));

const baseLead: Lead = {
  id: 'lead-1',
  localUuid: 'uuid-1',
  queryParams: null,
  deviceInfo: null,
  name: null,
  email: null,
  isFirstInputFocus: false,
  isPasswordTouched: false,
  isConfirmPasswordTouched: false,
  isPrivacyAccepted: false,
  isTermsAccepted: false,
  userId: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('createLeadRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('returns the lead when clientFetch resolves with a Lead with id', async () => {
    mockClientFetch.mockResolvedValueOnce(baseLead);

    const lead = await createLeadRequest({
      localUuid: 'uuid-1',
      deviceInfo: { userAgent: 'x' },
    });

    expect(lead).toEqual(baseLead);
  });

  it('throws ApiError(EMPTY_RESPONSE_BODY) when clientFetch resolves with null', async () => {
    // Simulates the TikTok webview case: 2xx with an empty/corrupted body.
    mockClientFetch.mockResolvedValue(null);

    await expect(
      createLeadRequest({
        localUuid: 'uuid-1',
        deviceInfo: { userAgent: 'x' },
      })
    ).rejects.toMatchObject({
      message: EMPTY_RESPONSE_BODY,
      status: StatusCodes.OK,
    });
    await expect(
      createLeadRequest({ localUuid: 'uuid-1' })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('throws when clientFetch resolves with an object missing id', async () => {
    mockClientFetch.mockResolvedValue({ name: 'no id here' });

    await expect(
      createLeadRequest({ localUuid: 'uuid-1' })
    ).rejects.toMatchObject({ message: EMPTY_RESPONSE_BODY });
  });

  it('retries transient failures and resolves on a later attempt', async () => {
    vi.useFakeTimers();
    mockClientFetch
      .mockRejectedValueOnce(
        new ApiError('Failed to fetch', NETWORK_FAILURE_STATUS)
      )
      .mockResolvedValueOnce(baseLead);

    const promise = createLeadRequest({ localUuid: 'uuid-1' });

    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toEqual(baseLead);
    expect(mockClientFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry 4xx failures', async () => {
    mockClientFetch.mockRejectedValue(
      new ApiError('validation', StatusCodes.UNPROCESSABLE_ENTITY)
    );

    await expect(
      createLeadRequest({ localUuid: 'uuid-1' })
    ).rejects.toMatchObject({ status: StatusCodes.UNPROCESSABLE_ENTITY });
    expect(mockClientFetch).toHaveBeenCalledTimes(1);
  });
});

describe('updateLeadRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('returns the lead when clientFetch resolves with a Lead with id', async () => {
    mockClientFetch.mockResolvedValueOnce({ ...baseLead, name: 'Ana' });

    const lead = await updateLeadRequest('lead-1', { name: 'Ana' });

    expect(lead.name).toBe('Ana');
  });

  it('throws ApiError(EMPTY_RESPONSE_BODY) when clientFetch resolves with null', async () => {
    mockClientFetch.mockResolvedValue(null);

    await expect(
      updateLeadRequest('lead-1', { name: 'Ana' })
    ).rejects.toMatchObject({
      message: EMPTY_RESPONSE_BODY,
      status: StatusCodes.OK,
    });
  });
});
