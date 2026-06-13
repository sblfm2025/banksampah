import { z } from 'zod';
import { DISTRICTS } from '../constants/districts';

export const wasteAiAnalysisSchema = z
  .object({
    sourceMessageIds: z.array(z.string().min(1)).optional(),
    intent: z.enum([
      'PICKUP_REQUEST',
      'REGULAR_SUBSCRIPTION_INQUIRY',
      'ASK_PRICE',
      'ASK_AREA',
      'COMPLAINT',
      'OTHER',
    ]),
    detectedDistrict: z.enum(DISTRICTS),
    addressCompleteness: z.enum(['COMPLETE', 'PARTIAL', 'MISSING']),
    photoQuality: z.enum(['CLEAR', 'PARTIAL', 'BLURRY', 'NO_PHOTO']),
    wasteVisible: z.boolean(),
    detectedWasteTypes: z
      .array(
        z.enum([
          'HOUSEHOLD_MIXED',
          'CARDBOARD',
          'PLASTIC',
          'ORGANIC',
          'GARDEN_WASTE',
          'BULKY_ITEM',
          'GLASS',
          'E_WASTE',
          'HAZARDOUS',
          'UNKNOWN',
        ]),
      )
      .min(1),
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
    recommendedServiceType: z.enum([
      'REGULAR_HOUSEHOLD_PICKUP',
      'ONE_TRIP_TRICYCLE',
      'NEEDS_OPERATOR_REVIEW',
      'REJECT',
    ]),
    needsOperatorReview: z.boolean(),
    needsMoreInfo: z.boolean(),
    missingFields: z.array(
      z.enum([
        'DISTRICT',
        'ADDRESS',
        'LOCATION',
        'PHOTO',
        'WASTE_DESCRIPTION',
      ]),
    ),
    safetyFlags: z
      .array(
        z.enum([
          'POSSIBLE_MEDICAL_WASTE',
          'POSSIBLE_CHEMICAL',
          'POSSIBLE_B3',
          'SHARP_OBJECTS',
          'CONSTRUCTION_DEBRIS',
          'DEAD_ANIMAL',
          'NONE',
        ]),
      )
      .min(1),
    customerReply: z.string().trim().min(1).max(700),
    operatorSummary: z.string().trim().min(1).max(1000),
    confidence: z.number().min(0).max(1),
    rawModelOutput: z.unknown().optional(),
  })
  .superRefine((analysis, context) => {
    if (analysis.safetyFlags.includes('NONE') && analysis.safetyFlags.length > 1) {
      context.addIssue({
        code: 'custom',
        path: ['safetyFlags'],
        message: 'NONE tidak boleh digabung dengan safety flag lain.',
      });
    }

    if (
      analysis.detectedDistrict === 'OUT_OF_AREA' &&
      analysis.recommendedServiceType !== 'REJECT'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['recommendedServiceType'],
        message: 'Permintaan luar wilayah tidak boleh direkomendasikan aktif.',
      });
    }

    if (analysis.needsMoreInfo && analysis.missingFields.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['missingFields'],
        message: 'Data yang kurang harus disebutkan.',
      });
    }
  });

export type WasteAiAnalysis = z.infer<typeof wasteAiAnalysisSchema>;
