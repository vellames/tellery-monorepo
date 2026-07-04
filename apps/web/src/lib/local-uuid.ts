const LOCAL_UUID_KEY = 'ai-history.localUuid';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Returns a stable, browser-local identifier persisted in localStorage.
 * Used to group a single browser's registration funnel into one lead.
 * Not guaranteed unique across browsers — only used as a grouping key.
 */
export function getLocalUuid(): string {
  if (typeof window === 'undefined') {
    return generateUuid();
  }

  const stored = window.localStorage.getItem(LOCAL_UUID_KEY);
  if (stored) {
    return stored;
  }

  const uuid = generateUuid();
  window.localStorage.setItem(LOCAL_UUID_KEY, uuid);
  return uuid;
}
