export const FIRST_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

export const paginateSkip = (pagination: PaginationQuery): number =>
  (pagination.page - 1) * pagination.limit;
