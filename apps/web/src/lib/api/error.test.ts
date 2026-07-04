import { describe, expect, it } from 'vitest';
import {
  ApiError,
  REQUEST_FAILED,
  NETWORK_FAILURE_STATUS,
  EMPTY_RESPONSE_BODY,
  classifyApiFailure,
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

describe('classifyApiFailure', () => {
  it('classifies network failures (status 0)', () => {
    expect(
      classifyApiFailure(
        new ApiError('Failed to fetch', NETWORK_FAILURE_STATUS)
      )
    ).toBe('network');
  });

  it('classifies empty-body responses by the marker message', () => {
    expect(classifyApiFailure(new ApiError(EMPTY_RESPONSE_BODY, 200))).toBe(
      'empty_body'
    );
  });

  it('classifies 5xx responses as server errors', () => {
    expect(classifyApiFailure(new ApiError('err', 500))).toBe('server_error');
    expect(classifyApiFailure(new ApiError('err', 502))).toBe('server_error');
    expect(classifyApiFailure(new ApiError('err', 503))).toBe('server_error');
  });

  it('classifies 4xx responses as client errors', () => {
    expect(classifyApiFailure(new ApiError('err', 400))).toBe('client_error');
    expect(classifyApiFailure(new ApiError('err', 401))).toBe('client_error');
    expect(classifyApiFailure(new ApiError('err', 404))).toBe('client_error');
    expect(classifyApiFailure(new ApiError('err', 422))).toBe('client_error');
  });

  it('classifies non-ApiError inputs as unexpected', () => {
    expect(classifyApiFailure(new Error('boom'))).toBe('unexpected');
    expect(classifyApiFailure('boom')).toBe('unexpected');
    expect(classifyApiFailure(null)).toBe('unexpected');
  });
});
