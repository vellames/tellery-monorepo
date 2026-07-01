import { z } from 'zod';
import { paginationQuerySchema } from './pagination.validation';

export const listHistoriesQuerySchema = paginationQuerySchema.extend({
  isFeatured: z.enum(['true', 'false']).transform((value) => value === 'true'),
  isFree: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === 'true'
    ),
});

export type ListHistoriesQuery = z.infer<typeof listHistoriesQuerySchema>;
