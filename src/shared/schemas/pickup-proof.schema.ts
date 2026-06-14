import { z } from 'zod';
import { PARTNER_DESTINATIONS } from '../constants/service-impact';
import type { PickupStatus } from '../constants/statuses';

export const ACTUAL_TRIP_RESULTS = [
  'COMPLETED_ONE_TRIP',
  'PARTIAL_PICKUP',
  'EXTRA_TRIP_REQUIRED',
  'CUSTOMER_NOT_AVAILABLE',
  'WASTE_NOT_READY',
  'LOCATION_NOT_FOUND',
  'ACCESS_BLOCKED',
  'HAZARDOUS_WASTE_FOUND',
  'CANCELLED_ON_SITE',
] as const;

export const completePickupInputSchema = z
  .object({
    actualTripResult: z.enum(ACTUAL_TRIP_RESULTS),
    beforePhotoUrls: z.array(z.url()).max(5).default([]),
    afterPhotoUrls: z.array(z.url()).max(5).default([]),
    finalWeightKg: z.number().nonnegative().optional(),
    partnerDestination: z.enum(PARTNER_DESTINATIONS).optional(),
    driverNotes: z.string().trim().max(1000).optional(),
  })
  .superRefine((input, context) => {
    if (
      input.beforePhotoUrls.length === 0 &&
      input.afterPhotoUrls.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['beforePhotoUrls'],
        message: 'Minimal satu bukti foto wajib diunggah.',
      });
    }

    if (
      input.actualTripResult !== 'COMPLETED_ONE_TRIP' &&
      !input.driverNotes
    ) {
      context.addIssue({
        code: 'custom',
        path: ['driverNotes'],
        message: 'Catatan wajib untuk hasil selain selesai satu trip.',
      });
    }
  });

export type CompletePickupInput = z.infer<typeof completePickupInputSchema>;

export function mapActualTripResultToStatus(
  result: CompletePickupInput['actualTripResult'],
): PickupStatus {
  switch (result) {
    case 'COMPLETED_ONE_TRIP':
      return 'COMPLETED';
    case 'PARTIAL_PICKUP':
    case 'EXTRA_TRIP_REQUIRED':
      return 'EXTRA_TRIP_REQUIRED';
    case 'CUSTOMER_NOT_AVAILABLE':
      return 'ASSIGNED';
    case 'WASTE_NOT_READY':
    case 'LOCATION_NOT_FOUND':
    case 'ACCESS_BLOCKED':
    case 'HAZARDOUS_WASTE_FOUND':
      return 'NEEDS_OPERATOR_REVIEW';
    case 'CANCELLED_ON_SITE':
      return 'CANCELLED';
  }
}
