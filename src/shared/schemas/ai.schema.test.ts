import { describe, expect, it } from 'vitest';
import { wasteAiAnalysisSchema } from './ai.schema';

const validAnalysis = {
  intent: 'PICKUP_REQUEST',
  detectedDistrict: 'PALETEANG',
  addressCompleteness: 'COMPLETE',
  photoQuality: 'CLEAR',
  wasteVisible: true,
  detectedWasteTypes: ['CARDBOARD'],
  volumeLevel: 'LARGE',
  tricycleLoadEstimate: 'THREE_QUARTERS',
  recommendedServiceType: 'ONE_TRIP_TRICYCLE',
  needsOperatorReview: true,
  needsMoreInfo: false,
  missingFields: [],
  safetyFlags: ['NONE'],
  customerReply: 'Permintaan sudah kami terima.',
  operatorSummary: 'Tumpukan kardus terlihat cukup besar.',
  confidence: 0.82,
} as const;

describe('wasteAiAnalysisSchema', () => {
  it('menerima hasil AI yang valid', () => {
    expect(wasteAiAnalysisSchema.safeParse(validAnalysis).success).toBe(true);
  });

  it('menolak rekomendasi layanan aktif di luar wilayah', () => {
    const result = wasteAiAnalysisSchema.safeParse({
      ...validAnalysis,
      detectedDistrict: 'OUT_OF_AREA',
    });

    expect(result.success).toBe(false);
  });

  it('mewajibkan daftar field ketika AI meminta data tambahan', () => {
    const result = wasteAiAnalysisSchema.safeParse({
      ...validAnalysis,
      needsMoreInfo: true,
      missingFields: [],
    });

    expect(result.success).toBe(false);
  });
});
