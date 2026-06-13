import { GoogleGenAI } from '@google/genai';
import {
  wasteAiAnalysisSchema,
  type WasteAiAnalysis,
} from '../../shared/schemas/ai.schema';
import {
  WASTE_ANALYSIS_SYSTEM_PROMPT,
  buildWasteAnalysisUserPrompt,
} from './prompts/waste-analysis.prompt';
import { WASTE_ANALYSIS_JSON_SCHEMA } from './waste-analysis.schema-json';

export interface AnalysisImage {
  bytes: Buffer;
  mimeType: string;
}

export interface WasteAnalysisInput {
  text?: string;
  locationText?: string;
  hasLocation: boolean;
  images: AnalysisImage[];
}

export interface WasteAnalyzer {
  analyze(input: WasteAnalysisInput): Promise<WasteAiAnalysis>;
}

export class AiAnalysisError extends Error {
  constructor(
    message: string,
    public readonly rawOutput?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AiAnalysisError';
  }
}

export class GeminiWasteAnalyzer implements WasteAnalyzer {
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model = 'gemini-2.5-flash',
  ) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY belum dikonfigurasi.');
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async analyze(input: WasteAnalysisInput): Promise<WasteAiAnalysis> {
    const prompt = buildWasteAnalysisUserPrompt({
      text: input.text,
      hasImage: input.images.length > 0,
      hasLocation: input.hasLocation,
      locationText: input.locationText,
    });
    const imageParts = input.images.map((image) => ({
      inlineData: {
        data: image.bytes.toString('base64'),
        mimeType: image.mimeType,
      },
    }));

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [...imageParts, { text: prompt }],
        },
      ],
      config: {
        systemInstruction: WASTE_ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: WASTE_ANALYSIS_JSON_SCHEMA,
        temperature: 0.1,
      },
    });

    if (!response.text) {
      throw new AiAnalysisError('AI_EMPTY_RESPONSE');
    }

    try {
      const rawModelOutput = JSON.parse(response.text);
      const analysis = wasteAiAnalysisSchema.parse(rawModelOutput);
      return { ...analysis, rawModelOutput };
    } catch (error) {
      throw new AiAnalysisError('AI_PARSE_FAILED', response.text, {
        cause: error,
      });
    }
  }
}

export function createSafeFallbackAnalysis(input?: {
  text?: string;
  hasImage?: boolean;
  hasLocation?: boolean;
}): WasteAiAnalysis {
  const normalizedText = input?.text?.toLocaleLowerCase('id-ID') ?? '';
  const detectedDistrict = normalizedText.includes('watang sawitto')
    ? 'WATANG_SAWITTO'
    : normalizedText.includes('paleteang')
      ? 'PALETEANG'
      : normalizedText.match(/\b(suppa|mattiro bulu|duampanua|lembang)\b/)
        ? 'OUT_OF_AREA'
        : 'UNKNOWN';
  const missingFields: WasteAiAnalysis['missingFields'] = [];
  if (detectedDistrict === 'UNKNOWN') missingFields.push('DISTRICT');
  if (!input?.hasLocation) missingFields.push('ADDRESS');
  if (!input?.hasImage) missingFields.push('PHOTO');

  return {
    intent: 'PICKUP_REQUEST',
    detectedDistrict,
    addressCompleteness: input?.hasLocation ? 'PARTIAL' : 'MISSING',
    photoQuality: input?.hasImage ? 'PARTIAL' : 'NO_PHOTO',
    wasteVisible: Boolean(input?.hasImage),
    detectedWasteTypes: ['UNKNOWN'],
    volumeLevel: 'UNKNOWN',
    tricycleLoadEstimate: 'UNKNOWN',
    recommendedServiceType:
      detectedDistrict === 'OUT_OF_AREA' ? 'REJECT' : 'NEEDS_OPERATOR_REVIEW',
    needsOperatorReview: true,
    needsMoreInfo: missingFields.length > 0,
    missingFields,
    safetyFlags: ['NONE'],
    customerReply:
      'Terima kasih. Permintaan sudah kami terima dan akan dicek operator. Mohon pastikan alamat dan foto sampah sudah dikirim.',
    operatorSummary: 'Analisis AI gagal atau tidak valid. Perlu pemeriksaan manual.',
    confidence: 0,
  };
}
