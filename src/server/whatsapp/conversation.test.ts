import { describe, expect, it } from 'vitest';
import { assembleConversation } from './conversation';
import type { StoredWhatsAppMessage } from './message.service';

function message(
  overrides: Partial<StoredWhatsAppMessage>,
): StoredWhatsAppMessage {
  return {
    id: 'message-1',
    direction: 'INBOUND',
    waMessageId: 'wamid-1',
    fromPhoneNumber: '628123456789',
    messageType: 'TEXT',
    occurredAt: new Date('2026-06-13T00:00:00.000Z'),
    rawPayload: {},
    processed: false,
    ...overrides,
  };
}

describe('assembleConversation', () => {
  it('menggabungkan teks, foto, dan lokasi berurutan', () => {
    const result = assembleConversation([
      message({ id: '1', text: 'Mau jemput di Paleteang' }),
      message({
        id: '2',
        messageType: 'IMAGE',
        mediaUrl: 'gs://bucket/photo.jpg',
      }),
      message({
        id: '3',
        messageType: 'LOCATION',
        location: { lat: -3.793, lng: 119.652, name: 'Dekat Masjid' },
      }),
    ]);

    expect(result.text).toBe('Mau jemput di Paleteang');
    expect(result.imageUrls).toEqual(['gs://bucket/photo.jpg']);
    expect(result.location?.name).toBe('Dekat Masjid');
    expect(result.sourceMessageIds).toEqual(['1', '2', '3']);
  });
});
