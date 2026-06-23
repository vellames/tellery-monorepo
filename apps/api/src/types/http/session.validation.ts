import { z } from 'zod';

export const startSessionBodySchema = z.object({
  userId: z.string().min(1),
  historyId: z.string().min(1).optional(),
  historySlug: z.string().min(1).optional(),
});

export const interactBodySchema = z.object({
  stateId: z.string().min(1),
  interaction: z.string().min(1),
});

export type StartSessionBody = z.infer<typeof startSessionBodySchema>;
export type InteractBody = z.infer<typeof interactBodySchema>;
