export function addUnique<T>(items: T[], ...newItems: T[]): T[] {
  return Array.from(new Set([...items, ...newItems]));
}
