import { describe, expect, it } from 'vitest';
import {
  ApiError,
  REQUEST_FAILED,
  NETWORK_FAILURE_STATUS,
  extractErrorMessage,
  isApiError,
  isNetworkError,
} from '@/lib/api/error';

describe('ApiError', () => {
  it('carries message, status and body', () => {
    const error = new ApiError('boom', 500, { foo: 'bar' });
    expect(error.message).toBe('boom');
    expect(error.status).toBe(500);
    expect(error.body).toEqual({ foo: 'bar' });
    expect(error.name).toBe('ApiError');
  });

  it('is an instance of Error', () => {
    expect(new ApiError('x', 500)).toBeInstanceOf(Error);
  });
});

describe('isApiError', () => {
  it('returns true for ApiError instances', () => {
    expect(isApiError(new ApiError('x', 500))).toBe(true);
  });

  it('returns false for plain errors and other values', () => {
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError('string')).toBe(false);
  });
});

describe('extractErrorMessage', () => {
  it('returns the error message when present', () => {
    expect(extractErrorMessage(new Error('nope'))).toBe('nope');
    expect(extractErrorMessage(new ApiError('nope', 400))).toBe('nope');
  });

  it('falls back to the generic message when empty', () => {
    expect(extractErrorMessage(new Error(''))).toBe(REQUEST_FAILED);
    expect(extractErrorMessage(new Error('   '))).toBe(REQUEST_FAILED);
  });

  it('falls back for non-error values', () => {
    expect(extractErrorMessage(null)).toBe(REQUEST_FAILED);
    expect(extractErrorMessage(undefined)).toBe(REQUEST_FAILED);
  });
});

describe('isNetworkError', () => {
  it('returns true for an ApiError with the network-failure status', () => {
    expect(
      isNetworkError(new ApiError('Failed to fetch', NETWORK_FAILURE_STATUS))
    ).toBe(true);
  });

  it('returns false for other statuses and non-ApiError values', () => {
    expect(isNetworkError(new ApiError('boom', 500))).toBe(false);
    expect(isNetworkError(new Error('boom'))).toBe(false);
  });
});
