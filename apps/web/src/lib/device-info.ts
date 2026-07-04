/**
 * Collects as much device/browser info as the environment exposes, with
 * per-field guards so that a single missing/throwing API never breaks the page.
 *
 * Returns `undefined` during SSR or when the whole collection unexpectedly
 * throws — the lead is still created, just without deviceInfo.
 */
export function collectDeviceInfo(): Record<string, unknown> | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const nav = window.navigator;
    const screen = window.screen;

    const info: Record<string, unknown> = {
      userAgent: safe(() => nav.userAgent),
      language: safe(() => nav.language),
      languages: safe(() => nav.languages),
      platform: safe(() => nav.platform),
      cookieEnabled: safe(() => nav.cookieEnabled),
      doNotTrack: safe(() => nav.doNotTrack),
      hardwareConcurrency: safe(() => nav.hardwareConcurrency),
      deviceMemory: safe(
        () => (nav as Navigator & { deviceMemory?: number }).deviceMemory
      ),
      maxTouchPoints: safe(() => nav.maxTouchPoints),
      touchSupport: safe(
        () => 'ontouchstart' in window || (nav.maxTouchPoints ?? 0) > 0
      ),
      screenWidth: safe(() => screen.width),
      screenHeight: safe(() => screen.height),
      screenColorDepth: safe(() => screen.colorDepth),
      viewportWidth: safe(() => window.innerWidth),
      viewportHeight: safe(() => window.innerHeight),
      devicePixelRatio: safe(() => window.devicePixelRatio),
      timezone: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
      hostname: safe(() => window.location.hostname),
    };

    // Network Connection API (experimental, mostly Chrome/Edge). Super useful to
    // detect slow/mobile connections — included only when present.
    const connection = safe(
      () => (nav as Navigator & { connection?: NetworkInformation }).connection
    );
    if (connection) {
      info.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }

    return info;
  } catch {
    // Tracking must never break the form.
    return undefined;
  }
}

/** Runs `fn` and returns its result, or `undefined` if it throws. */
function safe<T>(fn: () => T): T | undefined {
  try {
    const value = fn();
    return value === null ? undefined : value;
  } catch {
    return undefined;
  }
}

// Minimal typing for the experimental Network Information API.
interface NetworkInformation {
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
}
