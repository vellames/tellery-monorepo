import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectDeviceInfo } from '../device-info';

describe('collectDeviceInfo', () => {
  const originalNavigator = window.navigator;
  const originalScreen = window.screen;

  beforeEach(() => {
    // jsdom defaults; tests override selectively.
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'screen', {
      value: originalScreen,
      configurable: true,
      writable: true,
    });
    // connection is added by some tests; ensure it is gone for the next one.
    delete (window.navigator as unknown as Record<string, unknown>).connection;
  });

  it('collects core browser fields from a standard environment', () => {
    const info = collectDeviceInfo();

    expect(info).toBeDefined();
    expect(typeof info?.userAgent).toBe('string');
    expect(typeof info?.language).toBe('string');
    expect(typeof info?.platform).toBe('string');
    expect(typeof info?.cookieEnabled).toBe('boolean');
    expect(typeof info?.viewportWidth).toBe('number');
    expect(typeof info?.viewportHeight).toBe('number');
    expect(typeof info?.devicePixelRatio).toBe('number');
    expect(typeof info?.touchSupport).toBe('boolean');
    expect(typeof info?.timezone).toBe('string');
  });

  it('collects screen dimensions', () => {
    const info = collectDeviceInfo();

    expect(info).toBeDefined();
    expect(typeof info?.screenWidth).toBe('number');
    expect(typeof info?.screenHeight).toBe('number');
    expect(typeof info?.screenColorDepth).toBe('number');
  });

  it('includes network connection info when navigator.connection is available', () => {
    Object.defineProperty(window.navigator, 'connection', {
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      },
      configurable: true,
    });

    const info = collectDeviceInfo();

    expect(info?.connection).toEqual({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    });
  });

  it('omits connection block when navigator.connection is not available', () => {
    const info = collectDeviceInfo();
    expect(info?.connection).toBeUndefined();
  });

  it('includes hostname', () => {
    const info = collectDeviceInfo();
    expect(typeof info?.hostname).toBe('string');
  });

  it('never throws when navigator access fails', () => {
    // Sabotage navigator so property access throws.
    Object.defineProperty(window, 'navigator', {
      get() {
        throw new Error('blocked');
      },
      configurable: true,
    });

    expect(() => collectDeviceInfo()).not.toThrow();
  });
});
