import { z } from 'zod';

export const ACTUAL_TRIP_RESULTS = [
  'COMPLETED_ONE_TRIP',
  'PARTIAL_PICKUP',
  'EXTRA_TRIP_REQUIRED',
  'CUSTOMER_NOT_AVAILABLE',
  'CANCELLED_ON_SITE',
] as const;

export const completePickupInputSchema = z
  .object({
    actualTripResult: z.enum(ACTUAL_TRIP_RESULTS),
    beforePhotoUrls: z.array(z.url()).max(5).default([]),
    afterPhotoUrls: z.array(z.url()).max(5).default([]),
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
