import { describe, expect, it } from 'vitest';
import { completePickupInputSchema } from './pickup-proof.schema';

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
});
