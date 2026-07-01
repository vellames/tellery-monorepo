export const REQUEST_FAILED = 'Request failed';

export const NETWORK_FAILURE_STATUS = 0;

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
