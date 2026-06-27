import { z } from 'zod';

export const startSessionBodySchema = z
  .object({
    historyId: z.string().min(1).optional(),
    historySlug: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.historyId || data.historySlug), {
    message: 'historyId or historySlug is required',
    path: ['historyId'],
  });

export const interactBodySchema = z.object({
  stateId: z.string().min(1),
  interaction: z.string().min(1),
});

export const conclusionBodySchema = z.object({
  answers: z
    .array(
      z.object({
        fieldId: z.string().min(1),
        optionId: z.string().min(1),
      })
    )
    .min(1, 'At least one answer is required'),
});

export type StartSessionBody = z.infer<typeof startSessionBodySchema>;
export type InteractBody = z.infer<typeof interactBodySchema>;
export type ConclusionBody = z.infer<typeof conclusionBodySchema>;
