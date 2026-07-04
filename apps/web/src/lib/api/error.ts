export const REQUEST_FAILED = 'Request failed';

export const EMPTY_RESPONSE_BODY = 'Empty response body';

export const NETWORK_FAILURE_STATUS = 0;

export type ApiFailureType =
  | 'network'
  | 'empty_body'
  | 'server_error'
  | 'client_error'
  | 'unexpected';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return REQUEST_FAILED;
}

export function isNetworkError(error: unknown): boolean {
  return isApiError(error) && error.status === NETWORK_FAILURE_STATUS;
}

/**
 * Classifies an error into a stable label so signup telemetry can distinguish
 * failure modes (network vs empty body vs server vs client) without leaking
 * internal error shapes. Used by the lead-tracking hook when capturing the
 * `signup_lead_create_error` Sentry event.
 */
export function classifyApiFailure(error: unknown): ApiFailureType {
  if (!isApiError(error)) return 'unexpected';
  if (error.status === NETWORK_FAILURE_STATUS) return 'network';
  if (error.message === EMPTY_RESPONSE_BODY) return 'empty_body';
  if (error.status >= 500) return 'server_error';
  return 'client_error';
}
