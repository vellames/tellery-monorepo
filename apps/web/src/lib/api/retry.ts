import {
  ApiError,
  EMPTY_RESPONSE_BODY,
  NETWORK_FAILURE_STATUS,
} from '@/lib/api/error';

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 300;
const MAX_JITTER_MS = 100;

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

/**
 * Returns true for failures worth retrying: transient network errors, server
 * errors, and the empty-response-body case observed in unstable webviews
 * (e.g. TikTok). Client errors (4xx) are never retried — the caller cannot
 * recover from them by repeating the request.
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === NETWORK_FAILURE_STATUS) return true;
  if (error.status >= 500) return true;
  return error.message === EMPTY_RESPONSE_BODY;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn` up to `maxAttempts` times, retrying only when `isRetryableError`
 * matches the thrown error. Uses exponential backoff with jitter
 * (baseDelayMs * 2^(attempt - 1) + jitter) to avoid thundering herds.
 *
 * When all attempts fail, the last error is rethrown untouched so callers and
 * telemetry still see the original status/message.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
  }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= maxAttempts;
      if (isLastAttempt || !isRetryableError(error)) {
        throw error;
      }

      const backoff = baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.floor(Math.random() * MAX_JITTER_MS);
      await sleep(backoff + jitter);
    }
  }

  // Unreachable: the loop either returns or throws. Kept for type safety.
  throw lastError;
}
