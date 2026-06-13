import { describe, expect, it } from 'vitest';
import { parseWhatsAppWebhook } from './webhook-parser';

const payload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'business-1',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            contacts: [
              { wa_id: '628123456789', profile: { name: 'Ibu Sari' } },
            ],
            messages: [
              {
                id: 'wamid.text-1',
                from: '628123456789',
                timestamp: '1781290800',
                type: 'text',
                text: { body: 'Mau jemput sampah di Paleteang' },
              },
              {
                id: 'wamid.image-1',
                from: '628123456789',
                timestamp: '1781290801',
                type: 'image',
                image: {
                  id: 'media-1',
                  mime_type: 'image/jpeg',
                  caption: 'Ini fotonya',
                },
              },
              {
                id: 'wamid.location-1',
                from: '628123456789',
                timestamp: '1781290802',
                type: 'location',
                location: {
                  latitude: -3.793,
                  longitude: 119.652,
                  name: 'Dekat Masjid',
                },
              },
            ],
          },
        },
      ],
    },
  ],
};

describe('parseWhatsAppWebhook', () => {
  it('memecah text, image, dan location dalam satu webhook', () => {
    const messages = parseWhatsAppWebhook(payload);

    expect(messages).toHaveLength(3);
    expect(messages[0]).toMatchObject({
      messageType: 'TEXT',
      customerDisplayName: 'Ibu Sari',
      text: 'Mau jemput sampah di Paleteang',
    });
    expect(messages[1]).toMatchObject({
      messageType: 'IMAGE',
      mediaId: 'media-1',
      text: 'Ini fotonya',
    });
    expect(messages[2].location).toEqual({
      lat: -3.793,
      lng: 119.652,
      name: 'Dekat Masjid',
    });
  });

  it('mengabaikan webhook status tanpa messages', () => {
    expect(
      parseWhatsAppWebhook({
        object: 'whatsapp_business_account',
        entry: [{ changes: [{ field: 'messages', value: {} }] }],
      }),
    ).toEqual([]);
  });
});
