import { z } from 'zod';

export const createCheckoutSchema = z
  .object({
    priceId: z.string().min(1).optional(),
  })
  .strict();
