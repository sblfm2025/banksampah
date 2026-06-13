import { z } from 'zod';

export const auditActorSchema = z.object({
  id: z.string().min(1).optional(),
  role: z
    .enum(['SYSTEM', 'SUPER_ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER'])
    .default('SYSTEM'),
});

export const auditEntityTypeSchema = z.enum([
  'PICKUP_REQUEST',
  'SCHEDULE',
  'USER',
  'CUSTOMER',
  'AI_ANALYSIS',
]);

export type AuditActor = z.infer<typeof auditActorSchema>;
export type AuditEntityType = z.infer<typeof auditEntityTypeSchema>;
