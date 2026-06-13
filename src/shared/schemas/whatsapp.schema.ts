import { z } from 'zod';
import { phoneNumberSchema } from './customer.schema';

const textPayloadSchema = z.object({
  body: z.string(),
});

const imagePayloadSchema = z.object({
  id: z.string().min(1),
  mime_type: z.string().optional(),
  sha256: z.string().optional(),
  caption: z.string().optional(),
});

const locationPayloadSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  name: z.string().optional(),
  address: z.string().optional(),
});

const inboundMessageSchema = z
  .object({
    id: z.string().min(1),
    from: phoneNumberSchema,
    timestamp: z.string().regex(/^\d+$/),
    type: z.string(),
    text: textPayloadSchema.optional(),
    image: imagePayloadSchema.optional(),
    location: locationPayloadSchema.optional(),
  })
  .passthrough();

const contactSchema = z.object({
  wa_id: phoneNumberSchema,
  profile: z.object({ name: z.string().optional() }).optional(),
});

const webhookValueSchema = z
  .object({
    messaging_product: z.literal('whatsapp').optional(),
    contacts: z.array(contactSchema).optional(),
    messages: z.array(inboundMessageSchema).optional(),
  })
  .passthrough();

export const whatsappWebhookPayloadSchema = z
  .object({
    object: z.string(),
    entry: z.array(
      z
        .object({
          id: z.string().optional(),
          changes: z.array(
            z
              .object({
                field: z.string(),
                value: webhookValueSchema,
              })
              .passthrough(),
          ),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export type ParsedWhatsAppMessage = {
  waMessageId: string;
  fromPhoneNumber: string;
  customerDisplayName?: string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION' | 'AUDIO' | 'DOCUMENT' | 'UNKNOWN';
  text?: string;
  mediaId?: string;
  mediaMimeType?: string;
  location?: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  };
  occurredAt: Date;
  rawPayload: unknown;
};
