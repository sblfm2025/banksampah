import { z } from 'zod';
import { DISTRICTS } from '../constants/districts';
import { SERVICE_TYPES } from '../constants/services';
import { wasteAiAnalysisSchema } from './ai.schema';
import { customerInputSchema } from './customer.schema';

export const createPickupRequestInputSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(200),
  source: z.enum(['WHATSAPP', 'ADMIN', 'PWA']),
  customer: customerInputSchema,
  district: z.enum(DISTRICTS),
  village: z.string().trim().min(1).max(120).optional(),
  villageId: z.string().trim().min(1).max(120).optional(),
  neighborhoodId: z.string().trim().min(1).max(120).optional(),
  pickupZoneId: z.string().trim().min(1).max(120).optional(),
  addressText: z.string().trim().min(1).max(500).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  locationAccuracyMeters: z.number().min(0).optional(),
  locationSource: z
    .enum([
      'WHATSAPP_SHARE_LOCATION',
      'BROWSER_GPS',
      'MANUAL_PIN',
      'MANUAL_TEXT',
      'OPERATOR_INPUT',
    ])
    .optional(),
  locationValidationStatus: z
    .enum([
      'INSIDE_SERVICE_AREA',
      'OUTSIDE_SERVICE_AREA',
      'NEEDS_OPERATOR_REVIEW',
      'UNKNOWN',
    ])
    .optional(),
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
  wasteDescription: z.string().trim().min(1).max(1000).optional(),
  photoUrls: z.array(z.url()).max(10),
  aiAnalysis: wasteAiAnalysisSchema.optional(),
  initialStatus: z
    .enum(['NEW', 'NEEDS_INFO', 'NEEDS_OPERATOR_REVIEW'])
    .default('NEW'),
});

export const updatePickupStatusInputSchema = z.object({
  status: z.enum([
    'NEW',
    'NEEDS_INFO',
    'NEEDS_OPERATOR_REVIEW',
    'CONFIRMED',
    'SCHEDULED',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'EXTRA_TRIP_REQUIRED',
    'REJECTED',
    'CANCELLED',
  ]),
  notes: z.string().trim().min(1).max(1000).optional(),
  rejectedReason: z.string().trim().min(1).max(500).optional(),
});

export const updatePickupIntakeInputSchema = z.object({
  district: z.enum(DISTRICTS),
  villageId: z.string().trim().min(1).max(120).optional(),
  addressText: z.string().trim().min(1).max(500).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  locationAccuracyMeters: z.number().min(0).optional(),
  locationSource: z
    .enum([
      'WHATSAPP_SHARE_LOCATION',
      'BROWSER_GPS',
      'MANUAL_PIN',
      'MANUAL_TEXT',
      'OPERATOR_INPUT',
    ])
    .optional(),
  locationValidationStatus: z
    .enum([
      'INSIDE_SERVICE_AREA',
      'OUTSIDE_SERVICE_AREA',
      'NEEDS_OPERATOR_REVIEW',
      'UNKNOWN',
    ])
    .optional(),
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
  wasteDescription: z.string().trim().min(1).max(1000).optional(),
  photoUrls: z.array(z.url()).max(10),
  aiAnalysis: wasteAiAnalysisSchema,
  status: z.enum(['NEEDS_INFO', 'NEEDS_OPERATOR_REVIEW']),
});

export const schedulePickupInputSchema = z
  .object({
    scheduledDate: z.iso.date(),
    scheduledTimeWindow: z.object({
      start: z.iso.time({ precision: -1 }),
      end: z.iso.time({ precision: -1 }),
    }),
    operatorNotes: z.string().trim().min(1).max(1000).optional(),
  })
  .refine(
    (input) =>
      input.scheduledTimeWindow.start < input.scheduledTimeWindow.end,
    {
      path: ['scheduledTimeWindow', 'end'],
      message: 'Waktu selesai harus setelah waktu mulai.',
    },
  );

export const assignDriverInputSchema = z.object({
  driverId: z.string().trim().min(1).max(120),
  driverName: z.string().trim().min(1).max(120),
});

export type CreatePickupRequestInput = z.infer<
  typeof createPickupRequestInputSchema
>;
export type UpdatePickupStatusInput = z.infer<
  typeof updatePickupStatusInputSchema
>;
export type UpdatePickupIntakeInput = z.infer<
  typeof updatePickupIntakeInputSchema
>;
export type SchedulePickupInput = z.infer<typeof schedulePickupInputSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverInputSchema>;
