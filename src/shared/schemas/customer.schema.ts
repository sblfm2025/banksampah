import { z } from 'zod';
import { DISTRICTS } from '../constants/districts';

export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{8,16}$/, 'Nomor telepon harus berisi 8-16 digit.');

export const customerInputSchema = z.object({
  phoneNumber: phoneNumberSchema,
  displayName: z.string().trim().min(1).max(120).optional(),
  fullName: z.string().trim().min(1).max(120).optional(),
  district: z.enum(DISTRICTS).default('UNKNOWN'),
  village: z.string().trim().min(1).max(120).optional(),
  addressText: z.string().trim().min(1).max(500).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  notes: z.string().trim().min(1).max(1000).optional(),
  createdFrom: z.enum(['WHATSAPP', 'ADMIN']),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export interface Customer extends CustomerInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
