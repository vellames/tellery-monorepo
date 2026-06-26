import { z } from 'zod';
import {
  DEFAULT_PAGE_LIMIT,
  FIRST_PAGE,
  MAX_PAGE_LIMIT,
} from '../pagination.types';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(FIRST_PAGE).default(FIRST_PAGE),
  limit: z
    .coerce
    .number()
    .int()
    .min(FIRST_PAGE)
    .max(MAX_PAGE_LIMIT)
    .default(DEFAULT_PAGE_LIMIT),
});
