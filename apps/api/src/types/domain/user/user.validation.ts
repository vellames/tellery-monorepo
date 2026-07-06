import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = createUserSchema.extend({
  leadId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
});

export const updateMeAddressSchema = z.object({
  zipCode: z.string().min(1),
  street: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
});

export const updateMeSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    ssn: z.string().nullable().optional(),
    address: updateMeAddressSchema.optional(),
  })
  .strict();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const createTemporaryUserSchema = z.object({
  leadId: z.string().uuid().optional(),
});

export const convertTemporaryUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});
