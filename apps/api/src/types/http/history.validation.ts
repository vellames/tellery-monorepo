import { z } from 'zod';

export const listHistoriesQuerySchema = z.object({
  isFeatured: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),
});

export type ListHistoriesQuery = z.infer<typeof listHistoriesQuerySchema>;
