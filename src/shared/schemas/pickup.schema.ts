import { z } from 'zod';
import { DISTRICTS } from '../constants/districts';
import { SERVICE_TYPES } from '../constants/services';
import { PICKUP_STATUSES } from '../constants/statuses';
import { wasteAiAnalysisSchema } from './ai.schema';

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const pickupRequestSchema = z.object({
  id: z.string().min(1),
  ticketCode: z.string().regex(/^JSP-\d{8}-\d{4}$/),
  source: z.enum(['WHATSAPP', 'ADMIN', 'PWA']),
  customerId: z.string().min(1),
  customerPhoneNumber: z.string().regex(/^\d{8,16}$/),
  customerName: z.string().trim().min(1).optional(),
  district: z.enum(DISTRICTS),
  village: z.string().trim().min(1).optional(),
  addressText: z.string().trim().min(1).optional(),
  location: locationSchema.optional(),
  serviceType: z.enum(SERVICE_TYPES),
  volumeLevel: z.enum([
    'SMALL',
    'MEDIUM',
    'LARGE',
    'OVERSIZED',
    'UNKNOWN',
  ]),
  tricycleLoadEstimate: z.enum([
    'NONE',
    'QUARTER',
    'HALF',
    'THREE_QUARTERS',
    'FULL',
    'OVER_CAPACITY',
    'UNKNOWN',
  ]),
  wasteDescription: z.string().trim().min(1).optional(),
  photoUrls: z.array(z.url()),
  aiAnalysis: wasteAiAnalysisSchema.optional(),
  status: z.enum(PICKUP_STATUSES),
  scheduledDate: z.iso.date().optional(),
  scheduledTimeWindow: z
    .object({
      start: z.iso.time({ precision: -1 }),
      end: z.iso.time({ precision: -1 }),
    })
    .optional(),
  assignedDriverId: z.string().min(1).optional(),
  assignedDriverName: z.string().trim().min(1).optional(),
  startedAt: z.iso.datetime().optional(),
  operatorNotes: z.string().trim().min(1).optional(),
  driverNotes: z.string().trim().min(1).optional(),
  completedAt: z.iso.datetime().optional(),
  cancelledAt: z.iso.datetime().optional(),
  rejectedReason: z.string().trim().min(1).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type PickupRequest = z.infer<typeof pickupRequestSchema>;
