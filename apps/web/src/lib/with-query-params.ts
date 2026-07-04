/**
 * Forwards the current URL's query params onto an internal route so that
 * attribution/marketing params (e.g. utm_*) are preserved across navigation
 * between auth pages (login <-> register).
 */
export function withQueryParams(
  path: string,
  search: string | null | undefined
): string {
  const query = (search ?? '').replace(/^\?/, '');
  if (query.length === 0) return path;
  return `${path}?${query}`;
}
