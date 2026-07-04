import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import * as Sentry from '@sentry/nextjs';
import { ApiError, EMPTY_RESPONSE_BODY } from '@/lib/api/error';

const mockCreateLeadRequest = vi.fn();
const mockUpdateLeadRequest = vi.fn();

vi.mock('@/lib/api/leads', () => ({
  createLeadRequest: (...args: unknown[]) => mockCreateLeadRequest(...args),
  updateLeadRequest: (...args: unknown[]) => mockUpdateLeadRequest(...args),
}));

vi.mock('@/lib/local-uuid', () => ({
  getLocalUuid: () => 'browser-uuid-1',
}));

vi.mock('@/lib/device-info', () => ({
  collectDeviceInfo: () => ({ userAgent: 'test-agent' }),
}));

import { useLeadTracking } from '../use-lead-tracking';
import type { Lead } from '@/lib/types/lead';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
  return wrapper;
}

const baseLead: Lead = {
  id: 'lead-1',
  localUuid: 'browser-uuid-1',
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

async function mount() {
  mockCreateLeadRequest.mockResolvedValueOnce(baseLead);
  const utils = renderHook(() => useLeadTracking(), {
    wrapper: createWrapper(),
  });
  // Wait for the mount effect's async create to resolve.
  await act(async () => {
    await vi.waitFor(() =>
      expect(mockCreateLeadRequest).toHaveBeenCalledTimes(1)
    );
  });
  return utils;
}

describe('useLeadTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('creates the lead once on mount', async () => {
    await mount();

    expect(mockCreateLeadRequest).toHaveBeenCalledTimes(1);
    expect(mockCreateLeadRequest).toHaveBeenCalledWith({
      localUuid: 'browser-uuid-1',
      queryParams: undefined,
      deviceInfo: { userAgent: 'test-agent' },
    });
  });

  it('does not create the lead twice (StrictMode guard)', async () => {
    const { rerender } = await mount();

    rerender();
    rerender();

    expect(mockCreateLeadRequest).toHaveBeenCalledTimes(1);
  });

  it('debounces field changes into a single PATCH with the latest value', async () => {
    const { result } = await mount();

    act(() => {
      result.current.setFieldValue('name', 'A');
    });
    act(() => {
      result.current.setFieldValue('name', 'An');
    });
    act(() => {
      result.current.setFieldValue('name', 'Ana');
    });

    // Not flushed yet.
    expect(mockUpdateLeadRequest).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(mockUpdateLeadRequest).toHaveBeenCalledTimes(1);
    expect(mockUpdateLeadRequest).toHaveBeenCalledWith('lead-1', {
      name: 'Ana',
    });
  });

  it('coalesces multiple fields into a single PATCH', async () => {
    const { result } = await mount();

    act(() => {
      result.current.setFieldValue('name', 'Ana');
    });
    act(() => {
      result.current.setFieldValue('email', 'ana@test.com');
    });

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(mockUpdateLeadRequest).toHaveBeenCalledTimes(1);
    expect(mockUpdateLeadRequest).toHaveBeenCalledWith('lead-1', {
      name: 'Ana',
      email: 'ana@test.com',
    });
  });

  it('does not PATCH when the value equals the server snapshot', async () => {
    const { result } = await mount();

    // First write: name -> "Ana" gets sent.
    act(() => {
      result.current.setFieldValue('name', 'Ana');
    });
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    expect(mockUpdateLeadRequest).toHaveBeenCalledTimes(1);

    // Second write with the same value: should be a no-op.
    act(() => {
      result.current.setFieldValue('name', 'Ana');
    });
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    expect(mockUpdateLeadRequest).toHaveBeenCalledTimes(1);
  });

  it('sends each touch milestone at most once', async () => {
    const { result } = await mount();

    act(() => {
      result.current.markPasswordTouched();
    });
    await act(async () => {
      vi.advanceTimersByTime(800);
      vi.runAllTicks();
    });
    expect(mockUpdateLeadRequest).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.markPasswordTouched();
    });
    await act(async () => {
      vi.advanceTimersByTime(800);
      vi.runAllTicks();
    });
    expect(mockUpdateLeadRequest).toHaveBeenCalledTimes(1);
  });

  it('combines a pending field change with a touch into one PATCH', async () => {
    const { result } = await mount();

    act(() => {
      result.current.setFieldValue('name', 'Ana');
    });
    act(() => {
      result.current.markPasswordTouched();
    });

    await act(async () => {
      vi.advanceTimersByTime(800);
      vi.runAllTicks();
    });

    expect(mockUpdateLeadRequest).toHaveBeenCalledTimes(1);
    expect(mockUpdateLeadRequest).toHaveBeenCalledWith('lead-1', {
      name: 'Ana',
      isPasswordTouched: true,
    });
  });

  it('flushAndReturnLeadId flushes pending changes immediately', async () => {
    const { result } = await mount();

    act(() => {
      result.current.setFieldValue('name', 'Ana');
    });

    let id: string | null = null;
    await act(async () => {
      id = result.current.flushAndReturnLeadId();
    });

    expect(id).toBe('lead-1');
    expect(mockUpdateLeadRequest).toHaveBeenCalledTimes(1);
    expect(mockUpdateLeadRequest).toHaveBeenCalledWith('lead-1', {
      name: 'Ana',
    });
  });

  it('keeps leadId null and tags the failure type when create rejects', async () => {
    const captureException = vi.mocked(Sentry.captureException);
    // Simulate a corrupted/empty body coming back from the BFF (TikTok webview case).
    mockCreateLeadRequest.mockRejectedValue(
      new ApiError(EMPTY_RESPONSE_BODY, StatusCodes.OK)
    );

    const { result } = renderHook(() => useLeadTracking(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await vi.waitFor(() => expect(mockCreateLeadRequest).toHaveBeenCalled());
      // Flush any pending microtasks so the .catch runs.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.leadId).toBeNull();

    expect(captureException).toHaveBeenCalledTimes(1);
    const [, captureOptions] = captureException.mock.calls[0];
    const signupContext = (
      captureOptions as { contexts: { signup: Record<string, unknown> } }
    ).contexts.signup;
    expect(signupContext.failureType).toBe('empty_body');
    expect(signupContext.httpStatus).toBe(StatusCodes.OK);
  });
});
