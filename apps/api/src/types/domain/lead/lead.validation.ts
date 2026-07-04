import { z } from 'zod';

export const createLeadSchema = z
  .object({
    localUuid: z.string().min(1),
    queryParams: z.string().optional(),
    deviceInfo: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const updateLeadSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().optional(),
    isFirstInputFocus: z.boolean().optional(),
    isPasswordTouched: z.boolean().optional(),
    isConfirmPasswordTouched: z.boolean().optional(),
    isPrivacyAccepted: z.boolean().optional(),
    isTermsAccepted: z.boolean().optional(),
  })
  .strict();
