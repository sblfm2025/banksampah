import { describe, expect, it } from 'vitest';
import {
  completePickupInputSchema,
  mapActualTripResultToStatus,
} from './pickup-proof.schema';

describe('completePickupInputSchema', () => {
  it('menerima pickup selesai dengan minimal satu bukti foto', () => {
    const result = completePickupInputSchema.safeParse({
      actualTripResult: 'COMPLETED_ONE_TRIP',
      beforePhotoUrls: ['https://example.com/before.jpg'],
      afterPhotoUrls: [],
    });

    expect(result.success).toBe(true);
  });

  it('menolak penyelesaian tanpa bukti foto', () => {
    const result = completePickupInputSchema.safeParse({
      actualTripResult: 'COMPLETED_ONE_TRIP',
      beforePhotoUrls: [],
      afterPhotoUrls: [],
    });

    expect(result.success).toBe(false);
  });

  it('mewajibkan catatan untuk hasil selain selesai satu trip', () => {
    const result = completePickupInputSchema.safeParse({
      actualTripResult: 'EXTRA_TRIP_REQUIRED',
      beforePhotoUrls: ['https://example.com/before.jpg'],
      afterPhotoUrls: [],
    });

    expect(result.success).toBe(false);
  });

  it.each([
    'WASTE_NOT_READY',
    'LOCATION_NOT_FOUND',
    'ACCESS_BLOCKED',
    'HAZARDOUS_WASTE_FOUND',
  ] as const)('mengirim hasil bermasalah %s ke review operator', (result) => {
    expect(mapActualTripResultToStatus(result)).toBe('NEEDS_OPERATOR_REVIEW');
  });
});
