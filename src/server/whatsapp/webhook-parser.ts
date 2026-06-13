import {
  whatsappWebhookPayloadSchema,
  type ParsedWhatsAppMessage,
} from '../../shared/schemas/whatsapp.schema';

const SUPPORTED_TYPES = {
  text: 'TEXT',
  image: 'IMAGE',
  location: 'LOCATION',
  audio: 'AUDIO',
  document: 'DOCUMENT',
} as const;

export function parseWhatsAppWebhook(
  payload: unknown,
): ParsedWhatsAppMessage[] {
  const parsed = whatsappWebhookPayloadSchema.parse(payload);
  const results: ParsedWhatsAppMessage[] = [];

  for (const entry of parsed.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages' || !change.value.messages) {
        continue;
      }

      const contactNames = new Map(
        (change.value.contacts ?? []).map((contact) => [
          contact.wa_id,
          contact.profile?.name,
        ]),
      );

      for (const message of change.value.messages) {
        const messageType =
          SUPPORTED_TYPES[message.type as keyof typeof SUPPORTED_TYPES] ??
          'UNKNOWN';

        results.push({
          waMessageId: message.id,
          fromPhoneNumber: message.from,
          customerDisplayName: contactNames.get(message.from),
          messageType,
          text: message.text?.body ?? message.image?.caption,
          mediaId: message.image?.id,
          mediaMimeType: message.image?.mime_type,
          location: message.location
            ? {
                lat: message.location.latitude,
                lng: message.location.longitude,
                name: message.location.name,
                address: message.location.address,
              }
            : undefined,
          occurredAt: new Date(Number(message.timestamp) * 1000),
          rawPayload: message,
        });
      }
    }
  }

  return results;
}
