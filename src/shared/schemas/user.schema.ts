import { z } from 'zod';

export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'OPERATOR',
  'DRIVER',
  'CUSTOMER',
]);

export const appUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phoneNumber: z.string().optional(),
  email: z.email().optional(),
  role: userRoleSchema,
  isActive: z.boolean(),
});

export type AppUser = z.infer<typeof appUserSchema>;
