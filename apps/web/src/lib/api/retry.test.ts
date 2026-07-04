import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withRetry, isRetryableError } from '@/lib/api/retry';
import {
  ApiError,
  EMPTY_RESPONSE_BODY,
  NETWORK_FAILURE_STATUS,
} from '@/lib/api/error';

describe('isRetryableError', () => {
  it('retries network failures', () => {
    expect(
      isRetryableError(new ApiError('Failed to fetch', NETWORK_FAILURE_STATUS))
    ).toBe(true);
  });

  it('retries 5xx server errors', () => {
    expect(isRetryableError(new ApiError('err', 500))).toBe(true);
    expect(isRetryableError(new ApiError('err', 503))).toBe(true);
  });

  it('retries the empty-response-body marker', () => {
    expect(isRetryableError(new ApiError(EMPTY_RESPONSE_BODY, 200))).toBe(true);
  });

  it('does not retry 4xx client errors', () => {
    expect(isRetryableError(new ApiError('err', 400))).toBe(false);
    expect(isRetryableError(new ApiError('err', 422))).toBe(false);
  });

  it('does not retry non-ApiError values', () => {
    expect(isRetryableError(new Error('boom'))).toBe(false);
    expect(isRetryableError('boom')).toBe(false);
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Deterministic backoff: zero jitter.
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves on the first attempt without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await withRetry(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries retryable failures and resolves once it succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError('Failed to fetch', NETWORK_FAILURE_STATUS)
      )
      .mockRejectedValueOnce(new ApiError(EMPTY_RESPONSE_BODY, 200))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn);

    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 4xx client error', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('validation', 422));

    await expect(withRetry(fn)).rejects.toMatchObject({ status: 422 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('propagates the last error after exhausting attempts', async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(
        new ApiError('Failed to fetch', NETWORK_FAILURE_STATUS)
      );

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });
    // Pre-attach a sink so the rejection isn't flagged as unhandled while the
    // fake timers drive the retries.
    promise.catch(() => {});

    await vi.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({
      message: 'Failed to fetch',
      status: NETWORK_FAILURE_STATUS,
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries the empty-body marker until attempts are exhausted', async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new ApiError(EMPTY_RESPONSE_BODY, 200));

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });
    promise.catch(() => {});

    await vi.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({
      message: EMPTY_RESPONSE_BODY,
      status: 200,
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
