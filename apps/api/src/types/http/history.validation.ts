import { z } from 'zod';
import { paginationQuerySchema } from './pagination.validation';

export const listHistoriesQuerySchema = paginationQuerySchema.extend({
  isFeatured: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),
});

export type ListHistoriesQuery = z.infer<typeof listHistoriesQuerySchema>;
