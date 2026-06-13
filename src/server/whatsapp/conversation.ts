import type { StoredWhatsAppMessage } from './message.service';

export interface ConversationInput {
  phoneNumber: string;
  displayName?: string;
  text?: string;
  imageUrls: string[];
  location?: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  };
  sourceMessageIds: string[];
}

export function assembleConversation(
  messages: StoredWhatsAppMessage[],
): ConversationInput {
  if (messages.length === 0) {
    throw new Error('Conversation membutuhkan minimal satu pesan.');
  }

  const latest = messages.at(-1)!;
  const texts = messages
    .map((message) => message.text?.trim())
    .filter((text): text is string => Boolean(text));
  const location = messages
    .map((message) => message.location)
    .filter((value) => value !== undefined)
    .at(-1);

  return {
    phoneNumber: latest.fromPhoneNumber,
    displayName:
      messages
        .map((message) => message.customerDisplayName)
        .filter((value) => value !== undefined)
        .at(-1) ?? undefined,
    text: texts.length > 0 ? texts.join('\n') : undefined,
    imageUrls: messages
      .map((message) => message.mediaUrl)
      .filter((url): url is string => Boolean(url)),
    location,
    sourceMessageIds: messages.map((message) => message.id),
  };
}
